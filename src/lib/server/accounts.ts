import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';

export type SelectUserAccount = typeof schema.userAccount.$inferSelect;
export type InsertUserAccount = typeof schema.userAccount.$inferInsert;

export function createUserAccount(
	userId: string,
	name: string,
	description?: string
) {
	const account = db
		.insert(schema.userAccount)
		.values({
			userId,
			name,
			description
		})
		.returning()
		.get();

	return account;
}

export function deleteUserAccount(userId: string, id: number) {
	return db
		.delete(schema.userAccount)
		.where(
			and(eq(schema.userAccount.id, id), eq(schema.userAccount.userId, userId))
		)
		.returning()
		.get();
}

export function getUserAccount(userId: string, id: number) {
	const account = db
		.select()
		.from(schema.userAccount)
		.where(
			and(eq(schema.userAccount.id, id), eq(schema.userAccount.userId, userId))
		)
		.get();

	if (!account) {
		throw new Error('account not found');
	}

	return account;
}

export function getUserAccounts(userId: string) {
	return db
		.select()
		.from(schema.userAccount)
		.where(eq(schema.userAccount.userId, userId))
		.all();
}

export function updateUserAccount(
	accountId: number,
	updates: Partial<Omit<InsertUserAccount, 'id' | 'userId'>>
) {
	const updatedAccount = db
		.update(schema.userAccount)
		.set(updates)
		.where(eq(schema.userAccount.id, accountId))
		.returning()
		.get();

	if (!updatedAccount) {
		throw new Error(`Could not update account with id (${accountId})`);
	}

	return updatedAccount;
}
