import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';

export type SelectUserAccount = typeof schema.userAccount.$inferSelect;
export type InsertUserAccount = typeof schema.userAccount.$inferInsert;

export async function createUserAccount(
	userId: string,
	name: string,
	description?: string
) {
	const [account] = await db
		.insert(schema.userAccount)
		.values({
			userId,
			name,
			description
		})
		.returning();

	return account;
}

export async function deleteUserAccount(userId: string, id: number) {
	await db
		.delete(schema.userAccount)
		.where(
			and(eq(schema.userAccount.id, id), eq(schema.userAccount.userId, userId))
		);
}

export async function getUserAccount(userId: string, id: number) {
	const account = await db.query.userAccount.findFirst({
		where: (userAccount, { eq, and }) => {
			return and(eq(userAccount.id, id), eq(userAccount.userId, userId));
		}
	});

	if (!account) {
		throw new Error('account not found');
	}

	return account;
}

export async function getUserAccounts(userId: string) {
	return db.query.userAccount.findMany({
		where: (userAccount, { eq }) => {
			return eq(userAccount.userId, userId);
		}
	});
}

export async function updateUserAccount(
	accountId: number,
	updates: Partial<Omit<InsertUserAccount, 'id' | 'userId'>>
) {
	const [updatedAccount] = await db
		.update(schema.userAccount)
		.set(updates)
		.where(eq(schema.userAccount.id, accountId))
		.returning();

	if (!updatedAccount) {
		throw new Error(`Could not update account with id (${accountId})`);
	}

	return updatedAccount;
}
