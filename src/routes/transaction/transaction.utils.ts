import { db } from '$lib/server';
import { schema } from '$lib/server/schema';

export async function createUserTransaction(
	...insert: (typeof schema.userTransaction.$inferInsert)[]
) {
	return db.insert(schema.userTransaction).values(insert).returning();
}

export async function getUserTransactions(userId: string) {
	return db.query.userTransaction.findMany({
		where: (userTransaction, { eq }) => {
			return eq(userTransaction.userId, userId);
		}
	});
}

export async function getUserTransaction(userId: string, id: number) {
	return db.query.userTransaction.findFirst({
		where: (userTransaction, { eq, and }) => {
			return and(
				eq(userTransaction.userId, userId),
				eq(userTransaction.id, id)
			);
		}
	});
}
