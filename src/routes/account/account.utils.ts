import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

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

export async function getUserAccounts(userId: string) {
	return db.query.userAccount.findMany({
		where: (userAccount, { eq }) => eq(userAccount.userId, userId)
	});
}

export async function getUserAccount(userId: string, id: number) {
	return db.query.userAccount.findFirst({
		where: (userAccount, { eq, and }) =>
			and(eq(userAccount.id, id), eq(userAccount.userId, userId))
	});
}

export async function deleteUserAccount(userId: string, id: number) {
	await db
		.delete(schema.userAccount)
		.where(
			and(eq(schema.userAccount.id, id), eq(schema.userAccount.userId, userId))
		);
}
