import { createDatabase, tables } from '$db';
import { NotFoundError } from '$server/utils/not-found-error';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { accessGuard, hasAccess, isOwner, ownerGuard } from './access';

describe('accessGuard', () => {
	it('throws NotFoundError when user is not a member of the budget', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const outsider = createUser(db, 'outsider');

		expect(() => accessGuard(budget.id, outsider.id, db)).toThrow(NotFoundError);
	});

	it('does not throw when user is OWNER', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER');

		expect(() => accessGuard(budget.id, user.id, db)).not.toThrow();
	});

	it('does not throw when user is MEMBER', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'MEMBER');

		expect(() => accessGuard(budget.id, user.id, db)).not.toThrow();
	});

	it('throws when user is INVITEE', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'INVITEE');

		expect(() => accessGuard(budget.id, user.id, db)).toThrow(NotFoundError);
	});
});

describe('ownerGuard', () => {
	it('throws when user is MEMBER (not OWNER)', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'MEMBER');

		expect(() => ownerGuard(budget.id, user.id, db)).toThrow(NotFoundError);
	});

	it('does not throw when user is OWNER', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'OWNER');

		expect(() => ownerGuard(budget.id, user.id, db)).not.toThrow();
	});
});

describe('hasAccess', () => {
	it('used in query filters out INVITEE budgets', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const invitee = db
			.insert(tables.users)
			.values({ passwordHash: 'hash', username: 'invitee' })
			.returning()
			.get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'INVITEE', userId: invitee.id })
			.run();

		// OWNER sees the budget via hasAccess
		const ownerRows = db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(hasAccess(tables.budgets, owner.id, db))
			.all();
		expect(ownerRows).toHaveLength(1);

		// INVITEE does not see it (filtered out by hasAccess)
		const inviteeRows = db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(hasAccess(tables.budgets, invitee.id, db))
			.all();
		expect(inviteeRows).toHaveLength(0);
	});
});

describe('isOwner', () => {
	it('used in query filters to only OWNER budgets', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const member = db
			.insert(tables.users)
			.values({ passwordHash: 'hash', username: 'member' })
			.returning()
			.get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: budget.id, role: 'MEMBER', userId: member.id })
			.run();

		// OWNER sees the budget via isOwner
		const ownerRows = db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(isOwner(tables.budgets, owner.id, db))
			.all();
		expect(ownerRows).toHaveLength(1);

		// MEMBER does not see it via isOwner
		const memberRows = db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(isOwner(tables.budgets, member.id, db))
			.all();
		expect(memberRows).toHaveLength(0);
	});
});
