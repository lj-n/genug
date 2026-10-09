import { createDatabase, type Database, tables } from '$db';
import * as runtime from '$lib/paraglide/runtime';
import { asMoney } from '$lib/utils/money';
import { currentMonth } from '$lib/utils/month';
import { NotFoundError } from '$server/utils/not-found-error';
import { getLocalTimeZone, today } from '@internationalized/date';
import { isHttpError } from '@sveltejs/kit';
import { eq, isNull } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { createAccount, createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { createUserCtx } from './index';

function createTransaction(
	db: Database,
	budgetId: string,
	accountId: string,
	overrides: Partial<typeof tables.transactions.$inferInsert> = {}
) {
	return db
		.insert(tables.transactions)
		.values({ accountId, amount: 100, budgetId, date: '2025-01-01', ...overrides })
		.returning()
		.get();
}

function setup() {
	const db = createDatabase(':memory:');
	const { budget, user } = createBudgetWithUser(db);
	const account = createAccount(db, budget.id, 'Checking');
	return { account, budget, ctx: createUserCtx(user.id, db), db, user };
}

const originalGetLocale = runtime.getLocale;
afterEach(() => runtime.overwriteGetLocale(originalGetLocale));

describe('checkpoint.set', () => {
	it('seals every validated transaction and books no Adjustment when both sides match', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		createTransaction(db, budget.id, account.id, { amount: -250, validated: true });
		createTransaction(db, budget.id, account.id, { amount: -40, validated: false });

		const checkpoint = ctx.checkpoint.set(account.id, asMoney(750));

		const rows = db.select().from(tables.transactions).all();
		expect(rows).toHaveLength(3);
		expect(rows.filter((row) => row.validated).map((row) => row.checkpointId)).toEqual([
			checkpoint.id,
			checkpoint.id
		]);
		expect(rows.find((row) => !row.validated)?.checkpointId).toBeNull();
		expect(checkpoint).toMatchObject({ adjustment: null, bankBalance: 750 });
	});

	it('books one validated, uncategorised Adjustment for the difference and seals it', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });

		const checkpoint = ctx.checkpoint.set(account.id, asMoney(970));

		const adjustments = db
			.select()
			.from(tables.transactions)
			.where(eq(tables.transactions.notes, 'Adjustment'))
			.all();
		expect(adjustments).toHaveLength(1);
		expect(adjustments[0]).toMatchObject({
			accountId: account.id,
			amount: -30,
			categoryId: null,
			checkpointId: checkpoint.id,
			date: today(getLocalTimeZone()).toString(),
			validated: true
		});
		expect(checkpoint).toMatchObject({ adjustment: -30, bankBalance: 970 });
		expect(ctx.account.balances(account.id).validated).toBe(970);
	});

	it('moves Unassigned by the Adjustment', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		const before = ctx.budget.unassigned(budget.id, currentMonth()).unassigned;

		ctx.checkpoint.set(account.id, asMoney(1250));

		expect(ctx.budget.unassigned(budget.id, currentMonth()).unassigned).toBe(before + 250);
	});

	it("notes the Adjustment in the booking user's locale", () => {
		const { account, ctx, db } = setup();
		runtime.overwriteGetLocale(() => 'de');

		ctx.checkpoint.set(account.id, asMoney(500));

		const [adjustment] = db.select().from(tables.transactions).all();
		expect(adjustment.notes).toBe('Ausgleichsbuchung');
	});

	it('can be set when no transaction is left to seal', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		const first = ctx.checkpoint.set(account.id, asMoney(1000));

		const second = ctx.checkpoint.set(account.id, asMoney(1000));

		expect(second.id).not.toBe(first.id);
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(2);
		const [row] = db.select().from(tables.transactions).all();
		expect(row.checkpointId).toBe(first.id);
	});

	it('leaves a transaction added later with an earlier date uncovered', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, {
			amount: 1000,
			date: '2025-03-01',
			validated: true
		});
		ctx.checkpoint.set(account.id, asMoney(1000));

		const backdated = createTransaction(db, budget.id, account.id, {
			amount: -100,
			date: '2025-01-01',
			validated: true
		});

		const [row] = db
			.select()
			.from(tables.transactions)
			.where(eq(tables.transactions.id, backdated.id))
			.all();
		expect(row.checkpointId).toBeNull();
		expect(ctx.checkpoint.overview(account.id).toSeal.count).toBe(1);
	});

	it('rejects an archived account and writes nothing', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		db.update(tables.accounts).set({ archivedAt: new Date() }).run();

		expect(() => ctx.checkpoint.set(account.id, asMoney(900))).toThrow(
			expect.objectContaining({ status: 400 })
		);
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(0);
		expect(
			db.select().from(tables.transactions).where(isNull(tables.transactions.checkpointId)).all()
		).toHaveLength(1);
	});

	it('is allowed for a budget member', () => {
		const { account, budget, db } = setup();
		const member = createUser(db, 'member');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();

		const checkpoint = createUserCtx(member.id, db).checkpoint.set(account.id, asMoney(0));

		expect(checkpoint.createdBy).toBe(member.id);
	});

	it('answers 404 to a user outside the budget', () => {
		const { account, db } = setup();
		const outsider = createUser(db, 'outsider');

		expectNotFound(() => createUserCtx(outsider.id, db).checkpoint.set(account.id, asMoney(0)));
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(0);
	});

	it('goes with its account when the account is deleted', () => {
		const { account, ctx, db } = setup();
		ctx.checkpoint.set(account.id, asMoney(0));

		ctx.account.delete(account.id);

		expect(db.select().from(tables.checkpoints).all()).toHaveLength(0);
	});
});

describe('checkpoint.overview', () => {
	it('reports the validated Balance and what the next Checkpoint seals', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, {
			amount: 1000,
			date: '2025-02-10',
			validated: true
		});
		createTransaction(db, budget.id, account.id, {
			amount: -200,
			date: '2025-01-05',
			validated: true
		});
		createTransaction(db, budget.id, account.id, {
			amount: -50,
			date: '2024-12-01',
			validated: false
		});

		expect(ctx.checkpoint.overview(account.id)).toEqual({
			toSeal: { count: 2, firstDate: '2025-01-05', lastDate: '2025-02-10' },
			validatedBalance: 800
		});
	});

	it('counts nothing to seal once a Checkpoint covers everything', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		ctx.checkpoint.set(account.id, asMoney(1000));

		expect(ctx.checkpoint.overview(account.id)).toEqual({
			toSeal: { count: 0, firstDate: null, lastDate: null },
			validatedBalance: 1000
		});
	});

	it('answers 404 to a user outside the budget', () => {
		const { account, db } = setup();
		const outsider = createUser(db, 'outsider');

		expectNotFound(() => createUserCtx(outsider.id, db).checkpoint.overview(account.id));
	});
});

describe('checkpoint.history', () => {
	it('lists every Checkpoint newest first with bank balance, sealed count and Adjustment', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		createTransaction(db, budget.id, account.id, { amount: -200, validated: true });
		const first = ctx.checkpoint.set(account.id, asMoney(800));
		createTransaction(db, budget.id, account.id, { amount: 50, validated: true });
		const second = ctx.checkpoint.set(account.id, asMoney(900));

		expect(ctx.checkpoint.history(account.id)).toEqual([
			{
				adjustment: 50,
				bankBalance: 900,
				createdAt: second.createdAt,
				id: second.id,
				sealedCount: 2
			},
			{
				adjustment: null,
				bankBalance: 800,
				createdAt: first.createdAt,
				id: first.id,
				sealedCount: 2
			}
		]);
	});

	it('is empty for an account without Checkpoints', () => {
		const { account, ctx } = setup();

		expect(ctx.checkpoint.history(account.id)).toEqual([]);
	});

	it('answers 404 to a user outside the budget', () => {
		const { account, db } = setup();
		const outsider = createUser(db, 'outsider');

		expectNotFound(() => createUserCtx(outsider.id, db).checkpoint.history(account.id));
	});
});

describe('checkpoint.delete', () => {
	it("unseals exactly the latest Checkpoint's transactions and leaves their data, the Adjustment included, unchanged", () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		const first = ctx.checkpoint.set(account.id, asMoney(1000));
		createTransaction(db, budget.id, account.id, {
			amount: -200,
			categoryId: null,
			date: '2025-02-01',
			notes: 'Groceries',
			validated: true
		});
		createTransaction(db, budget.id, account.id, { amount: -40, validated: false });
		const latest = ctx.checkpoint.set(account.id, asMoney(790));
		const before = db.select().from(tables.transactions).all();

		ctx.checkpoint.delete(latest.id);

		const after = db.select().from(tables.transactions).all();
		expect(after).toEqual(
			before.map((row) => ({
				...row,
				checkpointId: row.checkpointId === latest.id ? null : row.checkpointId
			}))
		);
		expect(after.filter((row) => row.checkpointId === null)).toHaveLength(3);
		expect(after.find((row) => row.notes === 'Adjustment')).toMatchObject({
			amount: -10,
			checkpointId: null,
			validated: true
		});
		expect(ctx.checkpoint.history(account.id).map((checkpoint) => checkpoint.id)).toEqual([
			first.id
		]);
	});

	it('rejects a Checkpoint that is not the latest and changes nothing', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		const first = ctx.checkpoint.set(account.id, asMoney(1000));
		ctx.checkpoint.set(account.id, asMoney(1000));

		expect(() => ctx.checkpoint.delete(first.id)).toThrow(
			expect.objectContaining({
				body: expect.objectContaining({ code: 'checkpoint_not_latest' }),
				status: 400
			})
		);
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(2);
		const [row] = db.select().from(tables.transactions).all();
		expect(row.checkpointId).toBe(first.id);
	});

	it('rejects an archived account and changes nothing', () => {
		const { account, budget, ctx, db } = setup();
		createTransaction(db, budget.id, account.id, { amount: 1000, validated: true });
		const checkpoint = ctx.checkpoint.set(account.id, asMoney(1000));
		db.update(tables.accounts).set({ archivedAt: new Date() }).run();

		expect(() => ctx.checkpoint.delete(checkpoint.id)).toThrow(
			expect.objectContaining({
				body: expect.objectContaining({ code: 'account_archived' }),
				status: 400
			})
		);
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(1);
		const [row] = db.select().from(tables.transactions).all();
		expect(row.checkpointId).toBe(checkpoint.id);
	});

	it('is allowed for a budget member', () => {
		const { account, budget, ctx, db } = setup();
		const checkpoint = ctx.checkpoint.set(account.id, asMoney(0));
		const member = createUser(db, 'member');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();

		createUserCtx(member.id, db).checkpoint.delete(checkpoint.id);

		expect(db.select().from(tables.checkpoints).all()).toHaveLength(0);
	});

	it('answers 404 to a user outside the budget', () => {
		const { account, ctx, db } = setup();
		const checkpoint = ctx.checkpoint.set(account.id, asMoney(0));
		const outsider = createUser(db, 'outsider');

		expectNotFound(() => createUserCtx(outsider.id, db).checkpoint.delete(checkpoint.id));
		expect(db.select().from(tables.checkpoints).all()).toHaveLength(1);
	});

	it('answers 404 to an unknown Checkpoint', () => {
		const { ctx } = setup();

		expectNotFound(() => ctx.checkpoint.delete('missing'));
	});
});

function expectNotFound(fn: () => unknown) {
	try {
		fn();
	} catch (e) {
		expect(e instanceof NotFoundError || isHttpError(e, 404)).toBe(true);
		return;
	}
	expect.unreachable('expected a 404');
}
