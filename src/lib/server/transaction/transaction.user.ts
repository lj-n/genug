import { and, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { schema } from '../schema';

/**
 * Retrieves a user transaction from the database.
 * @param database The database instance.
 * @param userId The ID of the user associated with the transaction.
 * @param transactionId The ID of the transaction to retrieve.
 * @returns The retrieved user transaction, or undefined if not found.
 */
export function getUserTransaction(
	database: Database,
	userId: string,
	transactionId: number
): typeof schema.userTransaction.$inferSelect | undefined {
	return database
		.select()
		.from(schema.userTransaction)
		.where(
			and(
				eq(schema.userTransaction.userId, userId),
				eq(schema.userTransaction.id, transactionId)
			)
		)
		.get();
}

/**
 * Creates a user transaction in the database.
 * @param database The database instance.
 * @param draft The user transaction data to be inserted.
 * @returns The inserted user transaction.
 */
export function createUserTransaction(
	database: Database,
	draft: typeof schema.userTransaction.$inferInsert
): typeof schema.userTransaction.$inferSelect {
	return database
		.insert(schema.userTransaction)
		.values(draft)
		.returning()
		.get();
}

/**
 * Updates a user transaction in the database.
 * @param database The database instance.
 * @param userId The ID of the user associated with the transaction.
 * @param transactionId The ID of the transaction to be updated.
 * @param updates The partial data to be updated in the transaction.
 * @returns The updated user transaction.
 * @throws Error if the transaction with the specified ID is not found.
 */
export function updateUserTransaction(
	database: Database,
	userId: string,
	transactionId: number,
	updates: Partial<
		Omit<typeof schema.userTransaction.$inferInsert, 'userId' | 'id'>
	>
): typeof schema.userTransaction.$inferSelect {
	const transaction = database
		.update(schema.userTransaction)
		.set(updates)
		.where(
			and(
				eq(schema.userTransaction.userId, userId),
				eq(schema.userTransaction.id, transactionId)
			)
		)
		.returning()
		.get();

	if (!transaction)
		throw new Error(`Transaction with id (${transactionId}) not found.`);

	return transaction;
}

/**
 * Deletes a user transaction from the database.
 * @param database The database instance.
 * @param userId The ID of the user associated with the transaction.
 * @param transactionId The ID of the transaction to be deleted.
 * @returns The deleted user transaction.
 * @throws Error if the transaction with the specified ID is not found.
 */
export function deleteUserTransaction(
	database: Database,
	userId: string,
	transactionId: number
): typeof schema.userTransaction.$inferSelect {
	const transaction = database
		.delete(schema.userTransaction)
		.where(
			and(
				eq(schema.userTransaction.userId, userId),
				eq(schema.userTransaction.id, transactionId)
			)
		)
		.returning()
		.get();

	if (!transaction)
		throw new Error(`Transaction with id (${transactionId}) not found.`);

	return transaction;
}
