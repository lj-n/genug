import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { schema } from '../schema';

/**
 * Creates a new team account.
 * @param database The database instance.
 * @param draft The team account data to be inserted.
 * @returns The newly created team account row.
 */
export function createTeamAccount(
	database: Database,
	draft: typeof schema.teamAccount.$inferInsert
): typeof schema.teamAccount.$inferSelect {
	return database.insert(schema.teamAccount).values(draft).returning().get();
}

/**
 * Updates an existing team account.
 * @param database The database instance.
 * @param accountId The ID of the account.
 * @param updates The updates to apply to the team account.
 * @returns The updated team account row.
 */
export function updateTeamAccount(
	database: Database,
	accountId: number,
	update: Partial<
		Pick<typeof schema.teamAccount.$inferInsert, 'description' | 'name'>
	>
): typeof schema.teamAccount.$inferSelect {
	const account = database
		.update(schema.teamAccount)
		.set(update)
		.where(eq(schema.teamAccount.id, accountId))
		.returning()
		.get();

	if (!account) throw new Error(`Account with id (${accountId}) not found.`);

	return account;
}

/**
 * Deletes a team account.
 * @param database The database instance.
 * @param accountId The ID of the account to delete.
 * @returns The deleted team account row.
 */
export function deleteTeamAccount(
	database: Database,
	accountId: number
): typeof schema.teamAccount.$inferSelect {
	const account = database
		.delete(schema.teamAccount)
		.where(eq(schema.teamAccount.id, accountId))
		.returning()
		.get();

	if (!account) throw new Error(`Account with id (${accountId}) not found.`);

	return account;
}
