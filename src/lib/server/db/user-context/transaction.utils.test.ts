import { createDatabase, type Database, tables } from '$db';
import { getColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createAccount, createBudgetWithUser } from '../../../../test/fixtures';
import { withFilter, withPagination, withSorted } from './transaction.utils';

function baseQuery(db: Database) {
	return db.select(getColumns(tables.transactions)).from(tables.transactions).$dynamic();
}

function createCategory(db: Database, budgetId: string, name: string) {
	return db.insert(tables.categories).values({ budgetId, name }).returning().get();
}

function setupTransactions(db: Database) {
	const { budget, user } = createBudgetWithUser(db);
	const a1 = createAccount(db, budget.id, 'A1');
	const a2 = createAccount(db, budget.id, 'A2');
	const cat = createCategory(db, budget.id, 'Food');

	const tx1 = db
		.insert(tables.transactions)
		.values({
			accountId: a1.id,
			amount: -50,
			budgetId: budget.id,
			categoryId: cat.id,
			createdBy: user.id,
			date: '2025-01-01',
			notes: 'groceries',
			validated: true
		})
		.returning()
		.get();
	const tx2 = db
		.insert(tables.transactions)
		.values({
			accountId: a2.id,
			amount: -200,
			budgetId: budget.id,
			createdBy: user.id,
			date: '2025-01-15',
			notes: 'rent',
			validated: false
		})
		.returning()
		.get();
	const tx3 = db
		.insert(tables.transactions)
		.values({
			accountId: a1.id,
			amount: 1000,
			budgetId: budget.id,
			categoryId: cat.id,
			createdBy: user.id,
			date: '2025-02-01',
			notes: 'refund',
			validated: true
		})
		.returning()
		.get();

	return { a1, a2, budget, cat, tx1, tx2, tx3 };
}

describe('withFilter', () => {
	it('filters by accountId string', () => {
		const db = createDatabase(':memory:');
		const { a1, tx1, tx3 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { accountId: a1.id } });
		const result = dq.all();
		expect(result.map((t) => t.id).sort()).toEqual([tx1.id, tx3.id].sort());
	});

	it('filters by accountId array', () => {
		const db = createDatabase(':memory:');
		const { a1, a2 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { accountId: [a1.id, a2.id] } });
		const result = dq.all();
		expect(result).toHaveLength(3);
	});

	it('filters by categoryId including null', () => {
		const db = createDatabase(':memory:');
		const { cat } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { categoryId: [cat.id, 'null'] } });
		const result = dq.all();
		expect(result).toHaveLength(3);
	});

	it('filters by categoryId null only', () => {
		const db = createDatabase(':memory:');
		const { tx2 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { categoryId: ['null'] } });
		const result = dq.all();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(tx2.id);
	});

	it('filters by validated', () => {
		const db = createDatabase(':memory:');
		const { tx1, tx3 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { validated: true } });
		const result = dq.all();
		expect(result.map((t) => t.id).sort()).toEqual([tx1.id, tx3.id].sort());
	});

	it('filters by notes LIKE', () => {
		const db = createDatabase(':memory:');
		const { tx1 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { notes: 'grocer' } });
		const result = dq.all();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(tx1.id);
	});

	it('filters by minAmount (amounts >= minAmount)', () => {
		const db = createDatabase(':memory:');
		const { tx3 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { minAmount: 500 } });
		const result = dq.all();
		// gte(amount, 500) → amounts >= 500 → only tx3 (amount 1000) matches
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(tx3.id);
	});

	it('filters by maxAmount (amounts <= maxAmount)', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { maxAmount: -50 } });
		const result = dq.all();
		// lte(amount, -50) → amounts <= -50 → tx1=-50, tx2=-200 match
		expect(result).toHaveLength(2);
	});

	it('filters by fromDate', () => {
		const db = createDatabase(':memory:');
		const { tx3 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { fromDate: '2025-02-01' } });
		const result = dq.all();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(tx3.id);
	});

	it('filters by toDate', () => {
		const db = createDatabase(':memory:');
		const { tx1, tx2 } = setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db), filter: { toDate: '2025-01-15' } });
		const result = dq.all();
		expect(result.map((t) => t.id).sort()).toEqual([tx1.id, tx2.id].sort());
	});

	it('empty filter returns all', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withFilter({ dq: baseQuery(db) });
		expect(dq.all()).toHaveLength(3);
	});
});

describe('withPagination', () => {
	it('page 0, pageSize 2', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withPagination({ dq: baseQuery(db), page: 0, pageSize: 2 });
		expect(dq.all()).toHaveLength(2);
	});

	it('page 1, pageSize 2', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withPagination({ dq: baseQuery(db), page: 1, pageSize: 2 });
		expect(dq.all()).toHaveLength(1);
	});
});

describe('withSorted', () => {
	it('sorts by date asc', () => {
		const db = createDatabase(':memory:');
		const { tx1, tx2, tx3 } = setupTransactions(db);

		const dq = withSorted({ dq: baseQuery(db), sort: { date: 'asc' } });
		const result = dq.all();
		expect(result.map((t) => t.id)).toEqual([tx1.id, tx2.id, tx3.id]);
	});

	it('sorts by date desc', () => {
		const db = createDatabase(':memory:');
		const { tx1, tx2, tx3 } = setupTransactions(db);

		const dq = withSorted({ dq: baseQuery(db), sort: { date: 'desc' } });
		const result = dq.all();
		expect(result.map((t) => t.id)).toEqual([tx3.id, tx2.id, tx1.id]);
	});

	it('sorts by amount returns results', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withSorted({ dq: baseQuery(db), sort: { amount: 'asc' } });
		const result = dq.all();
		expect(result).toHaveLength(3);
	});

	it('sorts by validated asc', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withSorted({ dq: baseQuery(db), sort: { validated: 'asc' } });
		const result = dq.all();
		expect(result[0].validated).toBe(false);
		expect(result[2].validated).toBe(true);
	});

	it('empty sort defaults to createdAt DESC', () => {
		const db = createDatabase(':memory:');
		setupTransactions(db);

		const dq = withSorted({ dq: baseQuery(db) });
		const result = dq.all();
		// createdAt has second precision; fast in-memory inserts may share the same timestamp.
		// >= proves the sort is non-ascending (DESC-compatible even with ties).
		const timestamps = result.map((r) => new Date(r.createdAt).getTime());
		expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[2]);
	});
});
