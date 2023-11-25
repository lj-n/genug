import type { Database } from '../db';
import type { schema } from '../schema';

/**
 * Creates two transactions within a database transaction.
 * @param database The database instance.
 * @param outgoingTransactionCallback The callback function to create the outgoing transaction.
 * @param incomingTransactionCallback The callback function to create the incoming transaction.
 * @returns An object containing the outgoing and incoming transactions.
 */
export function createTransferTransactions(
	database: Database,
	outgoingTransactionCallback: (
		database: Database
	) =>
		| typeof schema.userTransaction.$inferSelect
		| typeof schema.teamTransaction.$inferSelect,
	incomingTransactionCallback: (
		database: Database
	) =>
		| typeof schema.userTransaction.$inferSelect
		| typeof schema.teamTransaction.$inferSelect
) {
	return database.transaction(() => {
		return {
			outgoingTransaction: outgoingTransactionCallback(database),
			incomingTransaction: incomingTransactionCallback(database)
		};
	});
}
