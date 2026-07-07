import { createDatabase, type Database, tables } from '$db';
import { NotFoundError } from '$server/utils/not-found-error';
import { describe, expect, it } from 'vitest';

import { createAccount, createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { hasAccess } from './access';
import { commands, queries } from './transaction';

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

describe('queries.list', () => {
	it('returns all transactions for user', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id, { amount: 100, date: '2025-01-01' });
		createTransaction(db, budget.id, a.id, { amount: 200, date: '2025-01-02' });
		const { list } = queries(user.id, db);

		const result = list();
		expect(result).toHaveLength(2);
	});

	it('filters by accountId', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a1 = createAccount(db, budget.id, 'A1');
		const a2 = createAccount(db, budget.id, 'A2');
		createTransaction(db, budget.id, a1.id);
		createTransaction(db, budget.id, a2.id);
		const { list } = queries(user.id, db);

		const result = list({ accountId: a1.id });
		expect(result).toHaveLength(1);
		expect(result[0].accountId).toBe(a1.id);
	});

	it('filters by validated', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id, { validated: true });
		createTransaction(db, budget.id, a.id, { validated: false });
		const { list } = queries(user.id, db);

		const validated = list({ validated: true });
		expect(validated).toHaveLength(1);
		expect(validated[0].validated).toBe(true);

		const pending = list({ validated: false });
		expect(pending).toHaveLength(1);
		expect(pending[0].validated).toBe(false);
	});

	it('sorts by date ascending', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id, { amount: 50, date: '2025-02-01' });
		createTransaction(db, budget.id, a.id, { amount: 100, date: '2025-01-01' });
		const { list } = queries(user.id, db);

		const result = list({}, { date: 'asc' });
		expect(result[0].amount).toBe(100);
		expect(result[1].amount).toBe(50);
	});

	it('paginates correctly', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		for (let i = 0; i < 5; i++) {
			createTransaction(db, budget.id, a.id, { amount: i, date: '2025-01-0' + (i + 1) });
		}
		const { list } = queries(user.id, db);

		const page0 = list({}, {}, { page: 0, pageSize: 2 });
		expect(page0).toHaveLength(2);

		const page1 = list({}, {}, { page: 1, pageSize: 2 });
		expect(page1).toHaveLength(2);
		expect(page0[0].id).not.toBe(page1[0].id);
	});

	it('excludes user without budget access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id);

		const outsider = createUser(db, 'outsider');

		// Direct hasAccess check — same pattern as access.test.ts
		const outsiderRows = db
			.select({ id: tables.transactions.id })
			.from(tables.transactions)
			.where(hasAccess(tables.transactions, outsider.id, db))
			.all();
		expect(outsiderRows).toHaveLength(0);
	});

	it('includes categoryName and createdByName', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'creator');
		const a = createAccount(db, budget.id, 'A');
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Food' })
			.returning()
			.get();
		createTransaction(db, budget.id, a.id, { categoryId: cat.id, createdBy: user.id });
		const { list } = queries(user.id, db);

		const result = list();
		expect(result[0]).toMatchObject({ categoryName: 'Food', createdByName: 'creator' });
	});
});

describe('queries.count', () => {
	it('returns total transaction count', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id);
		createTransaction(db, budget.id, a.id);
		const { count } = queries(user.id, db);

		expect(count()).toBe(2);
	});

	it('returns 0 when no transactions', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { count } = queries(user.id, db);

		expect(count()).toBe(0);
	});

	it('respects filters', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		createTransaction(db, budget.id, a.id, { validated: true });
		createTransaction(db, budget.id, a.id, { validated: false });
		const { count } = queries(user.id, db);

		expect(count({ validated: true })).toBe(1);
		expect(count({ validated: false })).toBe(1);
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

	it('defaults date to today when omitted', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const { create } = commands(user.id, db);

		const tx = create({ accountId: a.id, amount: -42, budgetId: budget.id });

		expect(tx.date).toBeDefined();
		expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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

	it('defaults validated to false when omitted', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = createAccount(db, budget.id, 'A');
		const tx = createTransaction(db, budget.id, a.id, { validated: true });
		const { edit } = commands(user.id, db);

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
