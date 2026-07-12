import { createDatabase, type Database, tables } from '$db';
import { UNASSIGNED } from '$lib/constants';
import { NotFoundError } from '$server/utils/not-found-error';
import { getLocalTimeZone, today } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

import { createAccount, createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { commands, queries } from './transaction';

function createCategory(db: Database, budgetId: string, name: string) {
	return db.insert(tables.categories).values({ budgetId, name }).returning().get();
}

function createTransaction(
	db: Database,
	budgetId: string,
	accountId: string,
	overrides: Partial<typeof tables.transactions.$inferInsert> = {}
) {
	return db
		.insert(tables.transactions)
		.values({
			accountId,
			amount: 100,
			budgetId,
			date: '2025-01-01',
			...overrides
		})
		.returning()
		.get();
}

describe('queries.byId', () => {
	it('returns transaction by id', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id);
		const { byId } = queries(user.id, db);

		const result = byId(tx.id);
		expect(result).toMatchObject({ amount: 100, id: tx.id });
	});

	it('throws for non-existent transaction', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { byId } = queries(user.id, db);

		expect(() => byId('nonexistent')).toThrow();
	});

	it('throws without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: _owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id);

		const outsider = createUser(db, 'outsider');
		const { byId } = queries(outsider.id, db);

		expect(() => byId(tx.id)).toThrow();
	});
});

describe('queries.page', () => {
	it('returns rows and matching total', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id, { amount: 100, date: '2025-01-01' });
		createTransaction(db, budget.id, a.id, { amount: 200, date: '2025-01-02' });
		const { page } = queries(user.id, db);

		const result = page({}, {}, { page: 0, pageSize: 15 });
		expect(result.rows).toHaveLength(2);
		expect(result.total).toBe(2);
	});

	it('filters by accountId', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a1 = createAccount(db, budget.id, 'A1');
		const a2 = createAccount(db, budget.id, 'A2');
		createTransaction(db, budget.id, a1.id);
		createTransaction(db, budget.id, a2.id);
		const { page } = queries(user.id, db);

		const result = page({ accountId: a1.id }, {}, { page: 0, pageSize: 15 });
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].accountId).toBe(a1.id);
		expect(result.total).toBe(1);
	});

	it('filters by category with UNASSIGNED sentinel alone', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const cat = createCategory(db, budget.id, 'Food');
		createTransaction(db, budget.id, a.id, { categoryId: cat.id });
		const unassigned = createTransaction(db, budget.id, a.id, { categoryId: null });
		const { page } = queries(user.id, db);

		const result = page({ categoryId: [UNASSIGNED] }, {}, { page: 0, pageSize: 15 });
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].id).toBe(unassigned.id);
		expect(result.total).toBe(1);
	});

	it('filters by category with UNASSIGNED sentinel mixed with real ids', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const food = createCategory(db, budget.id, 'Food');
		const rent = createCategory(db, budget.id, 'Rent');
		const foodTx = createTransaction(db, budget.id, a.id, { categoryId: food.id });
		createTransaction(db, budget.id, a.id, { categoryId: rent.id });
		const unassigned = createTransaction(db, budget.id, a.id, { categoryId: null });
		const { page } = queries(user.id, db);

		const result = page({ categoryId: [food.id, UNASSIGNED] }, {}, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id).sort()).toEqual([foodTx.id, unassigned.id].sort());
		expect(result.total).toBe(2);
	});

	it('searches notes with LIKE metacharacters treated literally', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const percent = createTransaction(db, budget.id, a.id, { notes: 'refund 100% done' });
		const underscore = createTransaction(db, budget.id, a.id, { notes: 'invoice_2025' });
		createTransaction(db, budget.id, a.id, { notes: 'invoice 2025' });
		const { page } = queries(user.id, db);

		const percentResult = page({ notes: '100%' }, {}, { page: 0, pageSize: 15 });
		expect(percentResult.rows.map((t) => t.id)).toEqual([percent.id]);
		expect(percentResult.total).toBe(1);

		const underscoreResult = page({ notes: 'invoice_' }, {}, { page: 0, pageSize: 15 });
		expect(underscoreResult.rows.map((t) => t.id)).toEqual([underscore.id]);
		expect(underscoreResult.total).toBe(1);
	});

	it('includes categoryName and createdByName', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'creator');
		const a = createAccount(db, budget.id, 'A');
		const cat = createCategory(db, budget.id, 'Food');
		createTransaction(db, budget.id, a.id, { categoryId: cat.id, createdBy: user.id });
		const { page } = queries(user.id, db);

		const result = page({}, {}, { page: 0, pageSize: 15 });
		expect(result.rows[0]).toMatchObject({ categoryName: 'Food', createdByName: 'creator' });
	});

	it('sorts by date', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const feb = createTransaction(db, budget.id, a.id, { date: '2025-02-01' });
		const jan = createTransaction(db, budget.id, a.id, { date: '2025-01-01' });
		const { page } = queries(user.id, db);

		const ascResult = page({}, { date: 'asc' }, { page: 0, pageSize: 15 });
		expect(ascResult.rows.map((t) => t.id)).toEqual([jan.id, feb.id]);

		const descResult = page({}, { date: 'desc' }, { page: 0, pageSize: 15 });
		expect(descResult.rows.map((t) => t.id)).toEqual([feb.id, jan.id]);
	});

	it('sorts by amount', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const big = createTransaction(db, budget.id, a.id, { amount: 500 });
		const small = createTransaction(db, budget.id, a.id, { amount: -100 });
		const { page } = queries(user.id, db);

		const result = page({}, { amount: 'asc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([small.id, big.id]);
	});

	it('sorts by validated', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const done = createTransaction(db, budget.id, a.id, { validated: true });
		const pending = createTransaction(db, budget.id, a.id, { validated: false });
		const { page } = queries(user.id, db);

		const result = page({}, { validated: 'asc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([pending.id, done.id]);
	});

	it('sorts by account', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a1 = createAccount(db, budget.id, 'A1');
		const a2 = createAccount(db, budget.id, 'A2');
		const first = createTransaction(db, budget.id, a1.id);
		const second = createTransaction(db, budget.id, a2.id);
		const [low, high] = a1.id < a2.id ? [first, second] : [second, first];
		const { page } = queries(user.id, db);

		const result = page({}, { account: 'asc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([low.id, high.id]);
	});

	it('sorts by category', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const c1 = createCategory(db, budget.id, 'C1');
		const c2 = createCategory(db, budget.id, 'C2');
		const first = createTransaction(db, budget.id, a.id, { categoryId: c1.id });
		const second = createTransaction(db, budget.id, a.id, { categoryId: c2.id });
		const [low, high] = c1.id < c2.id ? [first, second] : [second, first];
		const { page } = queries(user.id, db);

		const result = page({}, { category: 'desc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([high.id, low.id]);
	});

	it('applies multi-sort with fixed precedence (date before amount)', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const janBig = createTransaction(db, budget.id, a.id, { amount: 900, date: '2025-01-01' });
		const febSmall = createTransaction(db, budget.id, a.id, { amount: 10, date: '2025-02-01' });
		const janSmall = createTransaction(db, budget.id, a.id, { amount: 20, date: '2025-01-01' });
		const { page } = queries(user.id, db);

		// date takes precedence over amount regardless of the object's key order
		const result = page({}, { amount: 'asc', date: 'asc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([janSmall.id, janBig.id, febSmall.id]);
	});

	it('breaks ties by creation time, newest first', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const older = createTransaction(db, budget.id, a.id, {
			createdAt: new Date('2025-01-01T10:00:00Z'),
			date: '2025-01-01'
		});
		const newer = createTransaction(db, budget.id, a.id, {
			createdAt: new Date('2025-01-02T10:00:00Z'),
			date: '2025-01-01'
		});
		const { page } = queries(user.id, db);

		const result = page({}, { date: 'asc' }, { page: 0, pageSize: 15 });
		expect(result.rows.map((t) => t.id)).toEqual([newer.id, older.id]);
	});

	it('returns the first page with total across all pages', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		for (let i = 0; i < 5; i++) {
			createTransaction(db, budget.id, a.id, { amount: i, date: '2025-01-0' + (i + 1) });
		}
		const { page } = queries(user.id, db);

		const first = page({}, {}, { page: 0, pageSize: 2 });
		expect(first.rows).toHaveLength(2);
		expect(first.total).toBe(5);

		const second = page({}, {}, { page: 1, pageSize: 2 });
		expect(second.rows).toHaveLength(2);
		expect(second.rows[0].id).not.toBe(first.rows[0].id);
		expect(second.total).toBe(5);
	});

	it('returns empty rows with correct total past the last page', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id);
		createTransaction(db, budget.id, a.id);
		createTransaction(db, budget.id, a.id);
		const { page } = queries(user.id, db);

		const result = page({}, {}, { page: 7, pageSize: 2 });
		expect(result.rows).toHaveLength(0);
		expect(result.total).toBe(3);
	});

	it('hides transactions of a foreign budget', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id);

		const outsider = createUser(db, 'outsider');
		const { page } = queries(outsider.id, db);

		const result = page({}, {}, { page: 0, pageSize: 15 });
		expect(result.rows).toHaveLength(0);
		expect(result.total).toBe(0);
	});
});

describe('commands.create', () => {
	it('creates transaction', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const { create } = commands(user.id, db);

		const tx = create({ accountId: a.id, amount: -42, budgetId: budget.id, date: '2025-03-15' });

		expect(tx).toMatchObject({ accountId: a.id, amount: -42, date: '2025-03-15' });
		expect(tx.id).toBeDefined();
	});

	it('defaults date to today in local timezone when omitted', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const { create } = commands(user.id, db);

		// Direct ctx call bypasses the schema/adapter layer, so the business rule
		// "a transaction without a date is dated today" is enforced here.
		const tx = create({ accountId: a.id, amount: -42, budgetId: budget.id });

		expect(tx.date).toBe(today(getLocalTimeZone()).toString());
	});

	it('throws NotFoundError without budget access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const a = createAccount(db, budget.id, 'A');
		const outsider = createUser(db, 'outsider');
		const { create } = commands(outsider.id, db);

		expect(() =>
			create({ accountId: a.id, amount: 1, budgetId: budget.id, date: '2025-01-01' })
		).toThrow(NotFoundError);
	});
});

describe('commands.delete', () => {
	it('deletes transactions and returns them', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx1 = createTransaction(db, budget.id, a.id);
		const tx2 = createTransaction(db, budget.id, a.id);
		const { delete: del } = commands(user.id, db);

		const deleted = del([tx1.id, tx2.id]);

		expect(deleted).toHaveLength(2);
		expect(deleted.map((t) => t.id).sort()).toEqual([tx1.id, tx2.id].sort());
	});

	it('only deletes accessible transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user: _owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id);

		const outsider = createUser(db, 'outsider');
		const { delete: del } = commands(outsider.id, db);

		const deleted = del([tx.id]);
		expect(deleted).toHaveLength(0);
	});
});

describe('commands.edit', () => {
	it('updates transaction properties', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id, { amount: 100, notes: 'old' });
		const { edit } = commands(user.id, db);

		const updated = edit(tx.id, { amount: 200, notes: 'new' });

		expect(updated).toMatchObject({ amount: 200, id: tx.id, notes: 'new' });
	});

	it('resets validated to false when omitted', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id, { validated: true });
		const { edit } = commands(user.id, db);

		// Direct ctx call bypasses the schema default, so this asserts the
		// business rule "editing a transaction resets its validation" — the
		// `?? false` in edit() is the canonical enforcing line, not dead code.
		const updated = edit(tx.id, { amount: 300 });

		expect(updated.validated).toBe(false);
	});

	it('throws for non-existent transaction', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { edit } = commands(user.id, db);

		expect(() => edit('nonexistent', { amount: 1 })).toThrow();
	});
});

describe('commands.validate', () => {
	it('sets validated to true', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id, { validated: false });
		const { validate } = commands(user.id, db);

		const result = validate([tx.id], true);
		expect(result[0].validated).toBe(true);
	});

	it('sets validated to false', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id, { validated: true });
		const { validate } = commands(user.id, db);

		const result = validate([tx.id], false);
		expect(result[0].validated).toBe(false);
	});
});
