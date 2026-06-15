import { createDatabase, type Database, tables } from '$db';

export function createAccount(db: Database, budgetId: string, name: string) {
	return db.insert(tables.accounts).values({ budgetId, name }).returning().get();
}

export function createBudgetWithUser(
	db: Database,
	role: 'INVITEE' | 'MEMBER' | 'OWNER' = 'OWNER',
	username = 'testuser'
) {
	const user = db.insert(tables.users).values({ passwordHash: 'hash', username }).returning().get();
	const budget = db.insert(tables.budgets).values({ name: 'Test Budget' }).returning().get();
	db.insert(tables.usersToBudgets).values({ budgetId: budget.id, role, userId: user.id }).run();
	return { budget, user };
}

export function createMemoryDb() {
	return createDatabase(':memory:');
}

export function createUser(db: Database, username: string) {
	return db.insert(tables.users).values({ passwordHash: 'hash', username }).returning().get();
}
