import { createDatabase, tables } from '$db';
import { NotFoundError } from '$server/utils/not-found-error';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createAccount, createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { commands, queries } from './category';

describe('queries.all', () => {
	it('returns only non-archived categories', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { all } = queries(user.id, db);

		create(budget.id, 'Active');
		const archivedCat = create(budget.id, 'Archived');
		db.update(tables.categories)
			.set({ archivedAt: new Date() })
			.where(eq(tables.categories.id, archivedCat.id))
			.run();

		const result = all(budget.id);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Active');
	});

	it('returns empty for INVITEE', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'INVITEE');
		const { all } = queries(user.id, db);

		expect(all(budget.id)).toHaveLength(0);
	});
});

describe('queries.archived', () => {
	it('returns only archived categories', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archived } = queries(user.id, db);

		create(budget.id, 'Active');
		const archivedCat = create(budget.id, 'Archived');
		db.update(tables.categories)
			.set({ archivedAt: new Date() })
			.where(eq(tables.categories.id, archivedCat.id))
			.run();

		const result = archived(budget.id);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Archived');
	});
});

describe('queries.byId', () => {
	it('returns category by id', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const cat = create(budget.id, 'Test');

		const result = byId(cat.id);
		expect(result).toMatchObject({ id: cat.id, name: 'Test' });
	});

	it('throws for category without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const cat = create(budget.id, 'Hidden');

		const outsider = createUser(db, 'outsider');
		const { byId } = queries(outsider.id, db);

		expect(() => byId(cat.id)).toThrow();
	});
});

describe('queries.stats', () => {
	it('returns statistics with correct counts and sums', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { stats } = queries(user.id, db);

		const cat = create(budget.id, 'Groceries');

		// Two budget assignments
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.budgetAssignments)
			.values({ amount: 300, budgetId: budget.id, categoryId: cat.id, month: 202502 })
			.run();

		// One validated + one pending transaction
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -50,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15',
				validated: true
			})
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -30,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-02-01',
				validated: false
			})
			.run();

		const result = stats(cat.id);
		expect(result.totalAssignedBudgetCount).toBe(2);
		expect(result.totalAssignedBudgetSum).toBe(500);
		expect(result.totalRelatedTransactionCount).toBe(2);
		expect(result.totalRelatedTransactionSum).toBe(-80);
		expect(result.pendingTransactionCount).toBe(1);
	});

	it('currentTargetPercentage is null when no targetBalance', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { stats } = queries(user.id, db);

		const cat = create(budget.id, 'No Target');

		const result = stats(cat.id);
		expect(result.currentTargetPercentage).toBeNull();
	});

	it('throws for non-existent category', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { stats } = queries(user.id, db);

		expect(() => stats('nonexistent')).toThrow();
	});
});

describe('commands.create', () => {
	it('creates category and userEntityOrder', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		const cat = create(budget.id, 'Food');

		expect(cat).toMatchObject({ budgetId: budget.id, name: 'Food' });
		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityId, cat.id))
			.get();
		expect(order?.position).toBe(0);
	});

	it('throws NotFoundError without budget access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');
		const { create } = commands(outsider.id, db);

		expect(() => create(budget.id, 'Nope')).toThrow(NotFoundError);
	});
});

describe('commands.edit', () => {
	it('updates category properties', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Old');

		const updated = edit(cat.id, {
			archivedAt: new Date('2025-06-01'),
			name: 'New',
			notes: 'Some notes',
			targetBalance: 1000
		});

		expect(updated).toMatchObject({
			id: cat.id,
			name: 'New',
			notes: 'Some notes',
			targetBalance: 1000
		});
		expect(updated.archivedAt).toBeInstanceOf(Date);
	});

	it('throws for non-existent category', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { edit } = commands(user.id, db);

		expect(() => edit('nonexistent', { name: 'Nope' })).toThrow();
	});
});

describe('commands.reorder', () => {
	it('sets category positions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, reorder } = commands(user.id, db);

		const c1 = create(budget.id, 'C1');
		const c2 = create(budget.id, 'C2');
		const c3 = create(budget.id, 'C3');

		reorder([c3.id, c1.id, c2.id]);

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityType, 'category'))
			.all();

		expect(order.find((o) => o.entityId === c3.id)?.position).toBe(0);
		expect(order.find((o) => o.entityId === c1.id)?.position).toBe(1);
		expect(order.find((o) => o.entityId === c2.id)?.position).toBe(2);
	});
});
