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

describe('queries.archivability', () => {
	it('is archivable with zero balance and no pending transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const cat = create(budget.id, 'Empty');

		expect(archivability(cat.id)).toEqual({
			archivable: true,
			pendingTransactionCount: 0,
			remainingBalance: 0
		});
	});

	it('is archivable when assignments and transactions cancel out', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const cat = create(budget.id, 'Balanced');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
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

		expect(archivability(cat.id)).toEqual({
			archivable: true,
			pendingTransactionCount: 0,
			remainingBalance: 0
		});
	});

	it('is not archivable with remaining balance', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const cat = create(budget.id, 'Funded');
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();

		expect(archivability(cat.id)).toEqual({
			archivable: false,
			pendingTransactionCount: 0,
			remainingBalance: 200
		});
	});

	it('is not archivable with pending transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const cat = create(budget.id, 'Pending');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 30, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -30,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15',
				validated: false
			})
			.run();

		expect(archivability(cat.id)).toEqual({
			archivable: false,
			pendingTransactionCount: 1,
			remainingBalance: 0
		});
	});

	it('throws for category without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const cat = create(budget.id, 'Hidden');

		const outsider = createUser(db, 'outsider');
		const { archivability } = queries(outsider.id, db);

		expect(() => archivability(cat.id)).toThrow();
	});
});

describe('queries.deletability', () => {
	it('is deletable with zero remaining and no transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Empty');

		expect(deletability(cat.id)).toEqual({
			deletable: true,
			remainingBalance: 0,
			transactionCount: 0
		});
	});

	it('is deletable when assignments across months net to zero and there are no transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Balanced');
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.budgetAssignments)
			.values({ amount: -50, budgetId: budget.id, categoryId: cat.id, month: 202502 })
			.run();

		expect(deletability(cat.id)).toEqual({
			deletable: true,
			remainingBalance: 0,
			transactionCount: 0
		});
	});

	it('is not deletable with remaining balance', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Funded');
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();

		expect(deletability(cat.id)).toEqual({
			deletable: false,
			remainingBalance: 200,
			transactionCount: 0
		});
	});

	it('is not deletable with a pending transaction', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Pending');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 30, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -30,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15',
				validated: false
			})
			.run();

		expect(deletability(cat.id)).toEqual({
			deletable: false,
			remainingBalance: 0,
			transactionCount: 1
		});
	});

	it('is not deletable with a validated transaction (unlike archivable)', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability, deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Spent');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
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

		// The category cancels out to zero and has no pending transaction, so
		// it is archivable — but the validated transaction still makes it
		// non-deletable (Deletable ⟹ Archivable, never the reverse).
		expect(archivability(cat.id).archivable).toBe(true);
		expect(deletability(cat.id)).toEqual({
			deletable: false,
			remainingBalance: 0,
			transactionCount: 1
		});
	});

	it('reports the total transaction count and remaining balance', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const cat = create(budget.id, 'Mixed');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -30,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15',
				validated: true
			})
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -20,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-02-01',
				validated: false
			})
			.run();

		expect(deletability(cat.id)).toEqual({
			deletable: false,
			remainingBalance: 150,
			transactionCount: 2
		});
	});

	it('throws for category without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const cat = create(budget.id, 'Hidden');

		const outsider = createUser(db, 'outsider');
		const { deletability } = queries(outsider.id, db);

		expect(() => deletability(cat.id)).toThrow();
	});
});

describe('commands.delete', () => {
	it('removes the category and cascades its assignment rows', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteCategory } = commands(user.id, db);

		const cat = create(budget.id, 'Gone');
		// Assignments that net to zero across months keep Remaining at 0.
		db.insert(tables.budgetAssignments)
			.values({ amount: 40, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.budgetAssignments)
			.values({ amount: -40, budgetId: budget.id, categoryId: cat.id, month: 202502 })
			.run();

		deleteCategory(cat.id);

		const category = db
			.select()
			.from(tables.categories)
			.where(eq(tables.categories.id, cat.id))
			.get();
		expect(category).toBeUndefined();

		const assignments = db
			.select()
			.from(tables.budgetAssignments)
			.where(eq(tables.budgetAssignments.categoryId, cat.id))
			.all();
		expect(assignments).toHaveLength(0);
	});

	it("removes the category's user_entity_order rows", () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteCategory } = commands(user.id, db);

		const cat = create(budget.id, 'Ordered');

		deleteCategory(cat.id);

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityId, cat.id))
			.all();
		expect(order).toHaveLength(0);
	});

	it('throws 400 and leaves the category intact when a transaction exists', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteCategory } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const cat = create(budget.id, 'Used');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
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

		let thrown;
		try {
			deleteCategory(cat.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(cat.id).id).toBe(cat.id);
	});

	it('throws 400 and leaves the category intact when a balance remains', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteCategory } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const cat = create(budget.id, 'Funded');
		db.insert(tables.budgetAssignments)
			.values({ amount: 100, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();

		let thrown;
		try {
			deleteCategory(cat.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(cat.id).id).toBe(cat.id);
	});

	it('throws for category without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const cat = create(budget.id, 'Hidden');

		const outsider = createUser(db, 'outsider');
		const { delete: deleteCategory } = commands(outsider.id, db);

		expect(() => deleteCategory(cat.id)).toThrow();
	});
});

describe('commands.archive', () => {
	it('sets archivedAt when archivable', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);

		const cat = create(budget.id, 'Done');

		const archived = archive(cat.id);
		expect(archived.archivedAt).toBeInstanceOf(Date);
	});

	it('throws 400 and leaves category untouched when balance remains', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const cat = create(budget.id, 'Funded');
		db.insert(tables.budgetAssignments)
			.values({ amount: 100, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();

		let thrown;
		try {
			archive(cat.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(cat.id).archivedAt).toBeNull();
	});

	it('throws 400 when pending transactions exist', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const cat = create(budget.id, 'Pending');
		const a = createAccount(db, budget.id, 'A');
		db.insert(tables.budgetAssignments)
			.values({ amount: 30, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -30,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15',
				validated: false
			})
			.run();

		let thrown;
		try {
			archive(cat.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(cat.id).archivedAt).toBeNull();
	});

	it('throws for category without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const cat = create(budget.id, 'Hidden');

		const outsider = createUser(db, 'outsider');
		const { archive } = commands(outsider.id, db);

		expect(() => archive(cat.id)).toThrow();
	});
});

describe('commands.restore', () => {
	it('clears archivedAt', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create, restore } = commands(user.id, db);

		const cat = create(budget.id, 'Back');
		archive(cat.id);

		const restored = restore(cat.id);
		expect(restored.archivedAt).toBeNull();
	});

	it('throws for non-existent category', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { restore } = commands(user.id, db);

		expect(() => restore('nonexistent')).toThrow();
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

	it('throws 400 for duplicate name in the same budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		create(budget.id, 'Groceries');

		let thrown;
		try {
			create(budget.id, 'Groceries');
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
	});

	it('allows the same name in a different budget', () => {
		const db = createDatabase(':memory:');
		const { budget: b1, user } = createBudgetWithUser(db);
		const b2 = db.insert(tables.budgets).values({ name: 'Budget 2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: b2.id, role: 'OWNER', userId: user.id })
			.run();
		const { create } = commands(user.id, db);

		create(b1.id, 'Groceries');
		const cat = create(b2.id, 'Groceries');

		expect(cat).toMatchObject({ budgetId: b2.id, name: 'Groceries' });
	});
});

describe('commands.edit', () => {
	it('updates category properties', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Old');

		const updated = edit(cat.id, {
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
	});

	it('normalizes a target balance of 0 to null', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Targeted');
		edit(cat.id, { name: 'Targeted', targetBalance: 1000 });

		const updated = edit(cat.id, { name: 'Targeted', targetBalance: 0 });

		expect(updated.targetBalance).toBeNull();
	});

	it('leaves targetBalance untouched when it is not part of the update', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Targeted');
		edit(cat.id, { name: 'Targeted', targetBalance: 1000 });

		const updated = edit(cat.id, { name: 'Renamed' });

		expect(updated.targetBalance).toBe(1000);
	});

	it('does not write archivedAt', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Guarded');

		// @ts-expect-error -- archivedAt is not part of the edit interface
		const updated = edit(cat.id, { archivedAt: new Date(), name: 'Still here' });

		expect(updated.name).toBe('Still here');
		expect(updated.archivedAt).toBeNull();
	});

	it('throws for non-existent category', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { edit } = commands(user.id, db);

		expect(() => edit('nonexistent', { name: 'Nope' })).toThrow();
	});

	it('throws 400 when renaming to an existing name in the same budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		create(budget.id, 'Groceries');
		const cat = create(budget.id, 'Rent');

		let thrown;
		try {
			edit(cat.id, { name: 'Groceries' });
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
	});

	it('allows saving with its own unchanged name', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const cat = create(budget.id, 'Groceries');

		const updated = edit(cat.id, { name: 'Groceries', notes: 'Updated notes' });
		expect(updated).toMatchObject({ name: 'Groceries', notes: 'Updated notes' });
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
