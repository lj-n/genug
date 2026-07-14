import { createDatabase, tables } from '$db';
import { and, eq } from 'drizzle-orm';
import { expect, it } from 'vitest';

import { hashPassword } from './index';
import { createUser, deleteUser, getAllUsers, isFirstUser, setPassword, setUsername } from './user';

it('createUser - creates user with correct properties', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });

	const user = createUser({ db, passwordHash, username });

	expect(user).toHaveProperty('id');
	expect(user).toHaveProperty('createdAt');
	expect(user).toHaveProperty('isAdmin', false);
	expect(user).toHaveProperty('username', username);
});

it('createUser - throws on duplicate username', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });

	createUser({ db, passwordHash, username });

	expect(() => createUser({ db, passwordHash, username })).toThrow();
});

it('deleteUser - removes user from db', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });

	deleteUser({ db, userId: user.id });

	await expect(db.query.users.findFirst({ where: { id: user.id } })).resolves.toBeUndefined();
});

it('isFirstUser - returns true on empty db, false after first user', async () => {
	const db = createDatabase(':memory:');

	await expect(isFirstUser({ db })).resolves.toBe(true);

	const passwordHash = await hashPassword({ password: 'password123' });
	createUser({ db, passwordHash, username: 'testuser' });

	await expect(isFirstUser({ db })).resolves.toBe(false);
});

it('deleteUser - deletes budgets the user solely owns, even when others exist elsewhere', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'soloowner' });
	// An unrelated user with their own budget must not keep the solo budget alive.
	const other = createUser({ db, passwordHash, username: 'other' });
	const otherBudget = db.insert(tables.budgets).values({ name: 'Other Budget' }).returning().get();
	db.insert(tables.usersToBudgets)
		.values({ budgetId: otherBudget.id, role: 'OWNER', userId: other.id })
		.run();
	const budget = db.insert(tables.budgets).values({ name: 'Solo Budget' }).returning().get();
	db.insert(tables.usersToBudgets)
		.values({ budgetId: budget.id, role: 'OWNER', userId: user.id })
		.run();

	deleteUser({ db, userId: user.id });

	await expect(db.query.budgets.findFirst({ where: { id: budget.id } })).resolves.toBeUndefined();
	const otherStillExists = await db.query.budgets.findFirst({ where: { id: otherBudget.id } });
	expect(otherStillExists).toBeDefined();
});

it('deleteUser - promotes another member to owner when the budget has members', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const owner = createUser({ db, passwordHash, username: 'owner' });
	const member = createUser({ db, passwordHash, username: 'member' });
	const budget = db.insert(tables.budgets).values({ name: 'Shared Budget' }).returning().get();
	// The owner also solely owns a second budget, so the solo-owner cleanup and the
	// member-promotion path both run in the same deletion.
	const soloBudget = db.insert(tables.budgets).values({ name: 'Solo Budget' }).returning().get();
	db.insert(tables.usersToBudgets)
		.values([
			{ budgetId: budget.id, role: 'OWNER', userId: owner.id },
			{ budgetId: budget.id, role: 'MEMBER', userId: member.id },
			{ budgetId: soloBudget.id, role: 'OWNER', userId: owner.id }
		])
		.run();

	deleteUser({ db, userId: owner.id });

	const budgetStillExists = await db.query.budgets.findFirst({ where: { id: budget.id } });
	expect(budgetStillExists).toBeDefined();
	await expect(
		db.query.budgets.findFirst({ where: { id: soloBudget.id } })
	).resolves.toBeUndefined();

	const promoted = db
		.select({ role: tables.usersToBudgets.role })
		.from(tables.usersToBudgets)
		.where(
			and(
				eq(tables.usersToBudgets.budgetId, budget.id),
				eq(tables.usersToBudgets.userId, member.id)
			)
		)
		.get();
	expect(promoted?.role).toBe('OWNER');
});

it('deleteUser - leaves budgets owned by others untouched', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const owner = createUser({ db, passwordHash, username: 'owner' });
	const member = createUser({ db, passwordHash, username: 'member' });
	const budget = db.insert(tables.budgets).values({ name: 'Shared Budget' }).returning().get();
	db.insert(tables.usersToBudgets)
		.values([
			{ budgetId: budget.id, role: 'OWNER', userId: owner.id },
			{ budgetId: budget.id, role: 'MEMBER', userId: member.id }
		])
		.run();

	deleteUser({ db, userId: member.id });

	const budgetStillExists = await db.query.budgets.findFirst({ where: { id: budget.id } });
	expect(budgetStillExists).toBeDefined();

	const ownerStillOwner = db
		.select({ role: tables.usersToBudgets.role })
		.from(tables.usersToBudgets)
		.where(
			and(eq(tables.usersToBudgets.budgetId, budget.id), eq(tables.usersToBudgets.userId, owner.id))
		)
		.get();
	expect(ownerStillOwner?.role).toBe('OWNER');
});

it('getAllUsers - returns id and username, admins first', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	createUser({ db, passwordHash, username: 'regular' });
	createUser({ db, isAdmin: true, passwordHash, username: 'admin' });

	const users = getAllUsers({ db });

	expect(users).toHaveLength(2);
	expect(users[0]).toEqual({ id: expect.any(String), username: 'admin' });
	expect(users[1]).toMatchObject({ username: 'regular' });
});

it('setPassword - updates the hash so the new password authenticates', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'oldpassword' });
	const user = createUser({ db, passwordHash, username: 'testuser' });

	await setPassword({ db, password: 'newpassword', userId: user.id });

	const stored = await db.query.users.findFirst({ where: { id: user.id } });
	expect(stored?.passwordHash).not.toBe(passwordHash);
});

it('setUsername - updates the username', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'oldname' });

	setUsername({ db, userId: user.id, username: 'newname' });

	const stored = await db.query.users.findFirst({ where: { id: user.id } });
	expect(stored?.username).toBe('newname');
});
