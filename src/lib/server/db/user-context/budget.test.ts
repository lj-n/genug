import { createDatabase, type Database, tables } from '$db';
import { ReassignmentSchema } from '$lib/schemas/budget';
import { parseMonth } from '$lib/utils/month';
import { NotFoundError } from '$server/utils/not-found-error';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser, createMemoryDb, createUser } from '../../../../test/fixtures';
import { commands, queries } from './budget';

const month202501 = parseMonth(202501)!;

describe('queries.all', () => {
	it('returns budgets where user is OWNER or MEMBER', () => {
		const db = createDatabase(':memory:');
		const { budget: _b1, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const _b2 = db.insert(tables.budgets).values({ name: 'B2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: _b2.id, role: 'MEMBER', userId: user.id })
			.run();

		const { all } = queries(user.id, db);
		const result = all();
		expect(result).toHaveLength(2);
	});

	it('filters out INVITEE budgets', () => {
		const db = createDatabase(':memory:');
		const { budget: _budget, user } = createBudgetWithUser(db, 'INVITEE');

		const { all } = queries(user.id, db);
		expect(all()).toHaveLength(0);
	});
});

describe('queries.byId', () => {
	it('returns budget by id', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { byId } = queries(user.id, db);

		const result = byId(budget.id);
		expect(result).toMatchObject({ id: budget.id, name: 'Test Budget' });
	});

	it('throws for budget without access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');
		const { byId } = queries(outsider.id, db);

		expect(() => byId(budget.id)).toThrow();
	});
});

describe('queries.eligibleUsers', () => {
	it('returns users not yet in budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const other = createUser(db, 'other');
		const { eligibleUsers } = queries(user.id, db);

		const result = eligibleUsers(budget.id);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: other.id, name: 'other' });
	});

	it('excludes users already in budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const other = createUser(db, 'other');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: other.id })
			.run();
		const { eligibleUsers } = queries(user.id, db);

		expect(eligibleUsers(budget.id)).toHaveLength(0);
	});
});

describe('queries.findEligibleUser', () => {
	it('returns userId for eligible user', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const other = createUser(db, 'other');
		const { findEligibleUser } = queries(user.id, db);

		const result = findEligibleUser(budget.id, 'other');

		expect(result).toEqual({ userId: other.id });
	});

	it('throws for self-invite', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { findEligibleUser } = queries(user.id, db);

		expect(() => findEligibleUser(budget.id, 'owner')).toThrow();
	});

	it('throws for already invited user', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const invitee = createUser(db, 'invitee');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'INVITEE', userId: invitee.id })
			.run();
		const { findEligibleUser } = queries(user.id, db);

		expect(() => findEligibleUser(budget.id, 'invitee')).toThrow();
	});

	it('throws for already a member', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const member = createUser(db, 'member');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();
		const { findEligibleUser } = queries(user.id, db);

		expect(() => findEligibleUser(budget.id, 'member')).toThrow();
	});

	it('throws for non-existent user', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { findEligibleUser } = queries(user.id, db);

		expect(() => findEligibleUser(budget.id, 'nonexistent')).toThrow();
	});
});

describe('queries.invitations', () => {
	it('returns pending invites with budget and inviter name', () => {
		const db = createDatabase(':memory:');
		const { budget, user: _owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const invitee = createUser(db, 'invitee');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'INVITEE', userId: invitee.id })
			.run();
		const { invitations } = queries(invitee.id, db);

		const result = invitations();
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			budgetId: budget.id,
			budgetName: 'Test Budget',
			inviterName: 'owner'
		});
	});

	it('returns empty when no invitations', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { invitations } = queries(user.id, db);

		expect(invitations()).toHaveLength(0);
	});
});

describe('queries.monthly', () => {
	it('returns categories with activity, assigned, remaining', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Groceries' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -50,
				budgetId: budget.id,
				categoryId: cat.id,
				date: '2025-01-15'
			})
			.run();
		const { monthly } = queries(user.id, db);

		const result = monthly(budget.id, month202501);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			activity: -50,
			assigned: 200,
			id: cat.id,
			name: 'Groceries',
			remaining: 150
		});
	});

	it('returns empty for INVITEE', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'INVITEE');
		const { monthly } = queries(user.id, db);

		expect(monthly(budget.id, month202501)).toHaveLength(0);
	});

	it('orders categories by custom position from userEntityOrder', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const catA = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		const catB = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'B' })
			.returning()
			.get();
		const catC = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'C' })
			.returning()
			.get();
		db.insert(tables.userEntityOrder)
			.values([
				{ entityId: catA.id, entityType: 'category', position: 2, userId: user.id },
				{ entityId: catB.id, entityType: 'category', position: 0, userId: user.id },
				{ entityId: catC.id, entityType: 'category', position: 1, userId: user.id }
			])
			.run();
		const { monthly } = queries(user.id, db);

		const result = monthly(budget.id, month202501);
		expect(result.map((c) => c.name)).toEqual(['B', 'C', 'A']);
	});
});

describe('queries.unassigned', () => {
	const jan = parseMonth(202501)!;
	const feb = parseMonth(202502)!;

	it('calculates income up to the month minus assignments up to the month', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		// Income transaction (no categoryId)
		db.insert(tables.transactions)
			.values({ accountId: a.id, amount: 1000, budgetId: budget.id, date: '2025-01-01' })
			.run();
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Rent' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 300, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		const { unassigned } = queries(user.id, db);

		expect(unassigned(budget.id, jan).unassigned).toBe(700);
	});

	it('passes the breakdown fields through from the envelope seam', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		db.insert(tables.transactions)
			.values({ accountId: a.id, amount: 1000, budgetId: budget.id, date: '2025-01-01' })
			.run();
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Rent' })
			.returning()
			.get();
		// Assigned in February with no February income: February is the Bottleneck.
		db.insert(tables.budgetAssignments)
			.values({ amount: 300, budgetId: budget.id, categoryId: cat.id, month: 202502 })
			.run();
		const { unassigned } = queries(user.id, db);

		expect(unassigned(budget.id, jan)).toEqual({
			assignedUntilMonth: 0,
			bottleneck: feb,
			incomeUntilMonth: 1000,
			position: 1000,
			reserved: 300,
			unassigned: 700
		});
	});

	it('reaches back an uncovered future assignment', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		db.insert(tables.transactions)
			.values({ accountId: a.id, amount: 1000, budgetId: budget.id, date: '2025-01-01' })
			.run();
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Rent' })
			.returning()
			.get();
		// Assigned in February with no February income to cover it.
		db.insert(tables.budgetAssignments)
			.values({ amount: 300, budgetId: budget.id, categoryId: cat.id, month: 202502 })
			.run();
		const { unassigned } = queries(user.id, db);

		// Viewing January: 1000 - 0 - max(0, 300 - 0) = 700.
		expect(unassigned(budget.id, jan).unassigned).toBe(700);
	});

	it('returns 0 when no income', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { unassigned } = queries(user.id, db);

		expect(unassigned(budget.id, jan).unassigned).toBe(0);
	});

	it('returns an all-zero breakdown for a budget the user cannot access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const outsider = createUser(db, 'outsider');
		const { unassigned } = queries(outsider.id, db);

		expect(unassigned(budget.id, feb)).toEqual({
			assignedUntilMonth: 0,
			bottleneck: null,
			incomeUntilMonth: 0,
			position: 0,
			reserved: 0,
			unassigned: 0
		});
	});
});

describe('queries.users', () => {
	it('lists users sorted by role (OWNER > MEMBER > INVITEE)', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const member = createUser(db, 'member');
		const invitee = createUser(db, 'invitee');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'INVITEE', userId: invitee.id })
			.run();
		const { users } = queries(owner.id, db);

		const result = users(budget.id);
		expect(result).toHaveLength(3);
		expect(result.map((u) => u.role)).toEqual(['OWNER', 'MEMBER', 'INVITEE']);
	});
});

describe('commands.acceptInvite', () => {
	it('changes INVITEE role to MEMBER', () => {
		const db = createDatabase(':memory:');
		const { budget, user: invitee } = createBudgetWithUser(db, 'INVITEE', 'invitee');
		const { acceptInvite } = commands(invitee.id, db);

		acceptInvite(budget.id);

		const role = db
			.select({ role: tables.usersToBudgets.role })
			.from(tables.usersToBudgets)
			.where(eq(tables.usersToBudgets.userId, invitee.id))
			.get();
		expect(role?.role).toBe('MEMBER');
	});
});

describe('commands.assignment', () => {
	it('creates budget assignment', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Food' })
			.returning()
			.get();
		const { assignment } = commands(user.id, db);

		assignment({ amount: 500, budgetId: budget.id, categoryId: cat.id, month: 202501 });

		const row = db
			.select()
			.from(tables.budgetAssignments)
			.where(eq(tables.budgetAssignments.categoryId, cat.id))
			.get();
		expect(row?.amount).toBe(500);
	});

	it('updates existing assignment', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Food' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		const { assignment } = commands(user.id, db);

		assignment({ amount: 800, budgetId: budget.id, categoryId: cat.id, month: 202501 });

		const row = db
			.select()
			.from(tables.budgetAssignments)
			.where(eq(tables.budgetAssignments.categoryId, cat.id))
			.get();
		expect(row?.amount).toBe(800);
	});

	it('throws NotFoundError without budget access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');
		const { assignment } = commands(outsider.id, db);

		expect(() =>
			assignment({ amount: 100, budgetId: budget.id, categoryId: 'any', month: 202501 })
		).toThrow(NotFoundError);
	});
});

describe('commands.create', () => {
	it('creates budget and OWNER membership', () => {
		const db = createDatabase(':memory:');
		const user = createUser(db, 'creator');
		const { create } = commands(user.id, db);

		const budgetId = create({ name: 'My Budget' });

		expect(budgetId).toBeDefined();
		const membership = db
			.select()
			.from(tables.usersToBudgets)
			.where(eq(tables.usersToBudgets.userId, user.id))
			.get();
		expect(membership).toMatchObject({ budgetId, role: 'OWNER' });
	});
});

describe('commands.edit', () => {
	it('OWNER can update name and currency', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { edit } = commands(user.id, db);

		const updated = edit(budget.id, { currency: 'USD', name: 'Renamed' });

		expect(updated).toMatchObject({ currency: 'USD', id: budget.id, name: 'Renamed' });
	});

	it('MEMBER cannot edit', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'MEMBER');
		const { edit } = commands(user.id, db);

		expect(() => edit(budget.id, { name: 'Nope' })).toThrow(NotFoundError);
	});
});

describe('commands.invite', () => {
	it('OWNER can invite a user', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const invitee = createUser(db, 'invitee');
		const { invite } = commands(owner.id, db);

		invite(budget.id, invitee.username);

		const membership = db
			.select()
			.from(tables.usersToBudgets)
			.where(eq(tables.usersToBudgets.userId, invitee.id))
			.get();
		expect(membership).toMatchObject({ budgetId: budget.id, role: 'INVITEE' });
	});

	it('MEMBER cannot invite', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'MEMBER');
		const outsider = createUser(db, 'outsider');
		const { invite } = commands(user.id, db);

		expect(() => invite(budget.id, outsider.username)).toThrow(NotFoundError);
	});
});

describe('commands.removeUser', () => {
	it('OWNER can remove member', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const member = createUser(db, 'member');
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();
		const { removeUser } = commands(owner.id, db);

		removeUser(budget.id, member.id);

		const membership = db
			.select()
			.from(tables.usersToBudgets)
			.where(eq(tables.usersToBudgets.userId, member.id))
			.get();
		expect(membership).toBeUndefined();
	});

	it('user can remove themselves without OWNER check', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'MEMBER');
		const { removeUser } = commands(user.id, db);

		// Member removing themselves should work (self-removal bypasses ownerGuard)
		expect(() => removeUser(budget.id, user.id)).not.toThrow();

		const membership = db
			.select()
			.from(tables.usersToBudgets)
			.where(eq(tables.usersToBudgets.userId, user.id))
			.get();
		expect(membership).toBeUndefined();
	});
});

describe('commands.reorder', () => {
	it('sets budget positions', () => {
		const db = createDatabase(':memory:');
		const user = createUser(db, 'reorderer');
		const { create, reorder } = commands(user.id, db);

		const b1 = create({ name: 'B1' });
		const b2 = create({ name: 'B2' });
		const b3 = create({ name: 'B3' });

		reorder([b3, b1, b2]);

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityType, 'budget'))
			.all();

		expect(order.find((o) => o.entityId === b3)?.position).toBe(0);
		expect(order.find((o) => o.entityId === b1)?.position).toBe(1);
		expect(order.find((o) => o.entityId === b2)?.position).toBe(2);
	});
});

const getAssignment = (db: Database, categoryId: string, month = 202501) =>
	db
		.select()
		.from(tables.budgetAssignments)
		.where(
			and(
				eq(tables.budgetAssignments.categoryId, categoryId),
				eq(tables.budgetAssignments.month, month)
			)
		)
		.get();

describe('commands.reassignment', () => {
	it('moves amount from source category to target category', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const source = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Source' })
			.returning()
			.get();
		const target = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Target' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: source.id, month: 202501 })
			.run();
		const { reassignment } = commands(user.id, db);

		reassignment({
			amount: 100,
			budgetId: budget.id,
			month: month202501,
			sourceCategoryId: source.id,
			targetCategoryId: target.id
		});

		const sourceRow = getAssignment(db, source.id);
		const targetRow = getAssignment(db, target.id);
		expect(sourceRow?.amount).toBe(100);
		expect(targetRow?.amount).toBe(100);
	});

	it('sets source amount to zero when fully drained', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const source = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Source' })
			.returning()
			.get();
		const target = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Target' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 100, budgetId: budget.id, categoryId: source.id, month: 202501 })
			.run();
		const { reassignment } = commands(user.id, db);

		reassignment({
			amount: 100,
			budgetId: budget.id,
			month: month202501,
			sourceCategoryId: source.id,
			targetCategoryId: target.id
		});

		const sourceRow = getAssignment(db, source.id);
		expect(sourceRow?.amount).toBe(0);
		const targetRow = getAssignment(db, target.id);
		expect(targetRow?.amount).toBe(100);
	});

	it('creates negative source assignment when none existed', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const source = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Source' })
			.returning()
			.get();
		const target = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Target' })
			.returning()
			.get();
		const { reassignment } = commands(user.id, db);

		reassignment({
			amount: 100,
			budgetId: budget.id,
			month: month202501,
			sourceCategoryId: source.id,
			targetCategoryId: target.id
		});

		const sourceRow = getAssignment(db, source.id);
		expect(sourceRow?.amount).toBe(-100);
		const targetRow = getAssignment(db, target.id);
		expect(targetRow?.amount).toBe(100);
	});

	it('moves amount from source category to unassigned', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const source = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Source' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: source.id, month: 202501 })
			.run();
		const { reassignment } = commands(user.id, db);

		reassignment({
			amount: 100,
			budgetId: budget.id,
			month: month202501,
			sourceCategoryId: source.id,
			targetCategoryId: null
		});

		const sourceRow = getAssignment(db, source.id);
		expect(sourceRow?.amount).toBe(100);
	});

	it('handles negative amount (reverse transfer)', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const source = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Source' })
			.returning()
			.get();
		const target = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Target' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: source.id, month: 202501 })
			.run();
		db.insert(tables.budgetAssignments)
			.values({ amount: 50, budgetId: budget.id, categoryId: target.id, month: 202501 })
			.run();
		const { reassignment } = commands(user.id, db);

		reassignment({
			amount: -100,
			budgetId: budget.id,
			month: month202501,
			sourceCategoryId: source.id,
			targetCategoryId: target.id
		});

		const sourceRow = getAssignment(db, source.id);
		const targetRow = getAssignment(db, target.id);
		expect(sourceRow?.amount).toBe(150);
		expect(targetRow?.amount).toBe(-50);
	});

	it('throws NotFoundError without budget access', () => {
		const db = createMemoryDb();
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');
		const target = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Target' })
			.returning()
			.get();
		const { reassignment } = commands(outsider.id, db);

		expect(() =>
			reassignment({
				amount: 100,
				budgetId: budget.id,
				month: month202501,
				sourceCategoryId: target.id,
				targetCategoryId: null
			})
		).toThrow(NotFoundError);
	});

	it('throws when source and target are the same category', () => {
		const db = createMemoryDb();
		const { budget, user } = createBudgetWithUser(db);
		const cat = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Cat' })
			.returning()
			.get();
		db.insert(tables.budgetAssignments)
			.values({ amount: 200, budgetId: budget.id, categoryId: cat.id, month: 202501 })
			.run();
		const { reassignment } = commands(user.id, db);

		expect(() =>
			reassignment({
				amount: 100,
				budgetId: budget.id,
				month: month202501,
				sourceCategoryId: cat.id,
				targetCategoryId: cat.id
			})
		).toThrow();
	});

	it('rejects amount:0 at schema level', () => {
		const result = v.safeParse(ReassignmentSchema, {
			amount: 0,
			budgetId: 'any',
			month: 202501,
			sourceCategoryId: 'src',
			targetCategoryId: 'tgt'
		});
		expect(result.success).toBe(false);
	});

	it('throws when sourceCategory belongs to different budget', () => {
		const db = createMemoryDb();
		const { budget: budget1, user } = createBudgetWithUser(db);
		const budget2 = db.insert(tables.budgets).values({ name: 'Budget 2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget2.id, role: 'OWNER', userId: user.id })
			.run();
		const sourceInBudget2 = db
			.insert(tables.categories)
			.values({ budgetId: budget2.id, name: 'Source' })
			.returning()
			.get();
		const targetInBudget1 = db
			.insert(tables.categories)
			.values({ budgetId: budget1.id, name: 'Target' })
			.returning()
			.get();
		const { reassignment } = commands(user.id, db);

		expect(() =>
			reassignment({
				amount: 100,
				budgetId: budget1.id,
				month: month202501,
				sourceCategoryId: sourceInBudget2.id,
				targetCategoryId: targetInBudget1.id
			})
		).toThrow();
	});

	it('throws when targetCategory belongs to different budget', () => {
		const db = createMemoryDb();
		const { budget: budget1, user } = createBudgetWithUser(db);
		const budget2 = db.insert(tables.budgets).values({ name: 'Budget 2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget2.id, role: 'OWNER', userId: user.id })
			.run();
		const sourceInBudget1 = db
			.insert(tables.categories)
			.values({ budgetId: budget1.id, name: 'Source' })
			.returning()
			.get();
		const targetInBudget2 = db
			.insert(tables.categories)
			.values({ budgetId: budget2.id, name: 'Target' })
			.returning()
			.get();
		const { reassignment } = commands(user.id, db);

		expect(() =>
			reassignment({
				amount: 100,
				budgetId: budget1.id,
				month: month202501,
				sourceCategoryId: sourceInBudget1.id,
				targetCategoryId: targetInBudget2.id
			})
		).toThrow();
	});
});
