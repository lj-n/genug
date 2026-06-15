import { type Database, tables } from '$db';
import { getColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser, createMemoryDb } from '../../../../test/fixtures';
import { withOrder } from './utils';

function createAccounts(db: Database, budgetId: string, names: string[]) {
	return names.map((name) =>
		db.insert(tables.accounts).values({ budgetId, name }).returning().get()
	);
}

describe('withOrder', () => {
	it('entities with custom positions are sorted in ascending order', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const [a, b, c] = createAccounts(db, budget.id, ['A', 'B', 'C']);

		// Set positions: A=2, B=0, C=1
		db.insert(tables.userEntityOrder)
			.values({ entityId: a.id, entityType: 'account', position: 2, userId: user.id })
			.run();
		db.insert(tables.userEntityOrder)
			.values({ entityId: b.id, entityType: 'account', position: 0, userId: user.id })
			.run();
		db.insert(tables.userEntityOrder)
			.values({ entityId: c.id, entityType: 'account', position: 1, userId: user.id })
			.run();

		const qb = db.select(getColumns(tables.accounts)).from(tables.accounts).$dynamic();
		const result = withOrder(qb, tables.accounts, 'account', user.id).all();

		expect(result.map((r) => r.name)).toEqual(['B', 'C', 'A']);
	});

	it('entities without position entry land at the end', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const [a] = createAccounts(db, budget.id, ['A', 'B']);

		// Only A has a position
		db.insert(tables.userEntityOrder)
			.values({ entityId: a.id, entityType: 'account', position: 0, userId: user.id })
			.run();

		const qb = db.select(getColumns(tables.accounts)).from(tables.accounts).$dynamic();
		const result = withOrder(qb, tables.accounts, 'account', user.id).all();

		expect(result.map((r) => r.name)).toEqual(['A', 'B']);
	});

	it('entities with same position are sorted by createdAt ascending', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const [a, b] = createAccounts(db, budget.id, ['A', 'B']);

		// Both at position 0 — secondary sort by createdAt
		db.insert(tables.userEntityOrder)
			.values({ entityId: a.id, entityType: 'account', position: 0, userId: user.id })
			.run();
		db.insert(tables.userEntityOrder)
			.values({ entityId: b.id, entityType: 'account', position: 0, userId: user.id })
			.run();

		const qb = db.select(getColumns(tables.accounts)).from(tables.accounts).$dynamic();
		const result = withOrder(qb, tables.accounts, 'account', user.id).all();

		// A was created first → appears first
		expect(result.map((r) => r.name)).toEqual(['A', 'B']);
	});

	it('positions are user-scoped — user B does not see user A positions', () => {
		const db = createMemoryDb();
		const { budget, user: u1 } = createBudgetWithUser(db, 'OWNER', 'user1');
		const u2 = db
			.insert(tables.users)
			.values({ passwordHash: 'hash', username: 'user2' })
			.returning()
			.get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'OWNER', userId: u2.id })
			.run();

		const [a, b] = createAccounts(db, budget.id, ['A', 'B']);

		// u1 sees: B first, A second
		db.insert(tables.userEntityOrder)
			.values({ entityId: b.id, entityType: 'account', position: 0, userId: u1.id })
			.run();
		db.insert(tables.userEntityOrder)
			.values({ entityId: a.id, entityType: 'account', position: 1, userId: u1.id })
			.run();

		// u2 has no positions set → falls back to createdAt
		const qb1 = db.select(getColumns(tables.accounts)).from(tables.accounts).$dynamic();
		const result1 = withOrder(qb1, tables.accounts, 'account', u1.id).all();
		expect(result1.map((r) => r.name)).toEqual(['B', 'A']);

		const qb2 = db.select(getColumns(tables.accounts)).from(tables.accounts).$dynamic();
		const result2 = withOrder(qb2, tables.accounts, 'account', u2.id).all();
		expect(result2.map((r) => r.name)).toEqual(['A', 'B']);
	});
});
