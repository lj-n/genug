import { and, eq, sql } from 'drizzle-orm';
import { schema } from '../schema';
import type { Database } from '../db';

/**
 * Retrieves a user account from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param accountId The ID of the account.
 * @returns The user account row.
 */
export function getUserAccount(
	database: Database,
	userId: string,
	accountId: number
): typeof schema.userAccount.$inferSelect | undefined {
	return database
		.select()
		.from(schema.userAccount)
		.where(
			and(
				eq(schema.userAccount.userId, userId),
				eq(schema.userAccount.id, accountId)
			)
		)
		.get();
}

/**
 * Retrieves all user accounts for a given user.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @returns An array of user account rows.
 */
export function getUserAccounts(
	database: Database,
	userId: string
): Array<typeof schema.userAccount.$inferSelect> {
	return database
		.select()
		.from(schema.userAccount)
		.where(eq(schema.userAccount.userId, userId))
		.all();
}

/**
 * Creates a new user account.
 * @param database The database instance.
 * @param draft The user account data to be inserted.
 * @returns The newly created user account row.
 */
export function createUserAccount(
	database: Database,
	draft: typeof schema.userAccount.$inferInsert
): typeof schema.userAccount.$inferSelect {
	return database.insert(schema.userAccount).values(draft).returning().get();
}

/**
 * Updates an existing user account.
 * @param database The database instance.
 * @param accountId The ID of the account.
 * @param updates The updates to apply to the user account.
 * @returns The updated user account row.
 */
export function updateUserAccount(
	database: Database,
	userId: string,
	accountId: number,
	update: Partial<Omit<typeof schema.userAccount.$inferInsert, 'userId' | 'id'>>
): typeof schema.userAccount.$inferSelect {
	const account = database
		.update(schema.userAccount)
		.set(update)
		.where(
			and(
				eq(schema.userAccount.userId, userId),
				eq(schema.userAccount.id, accountId)
			)
		)
		.returning()
		.get();

	if (!account) throw new Error(`Account with id (${accountId}) not found.`);

	return account;
}

/**
 * Deletes a user account.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param accountId The ID of the account to delete.
 * @returns The deleted user account row.
 */
export function deleteUserAccount(
	database: Database,
	userId: string,
	accountId: number
): typeof schema.userAccount.$inferSelect {
	const account = database
		.delete(schema.userAccount)
		.where(
			and(
				eq(schema.userAccount.userId, userId),
				eq(schema.userAccount.id, accountId)
			)
		)
		.returning()
		.get();

	if (!account) throw new Error(`Account with id (${accountId}) not found.`);

	return account;
}

type AccountBalance = {
	/** The sum of all __validated__ transactions associated with this account. */
	validated: number;
	/** The sum of all __unvalidated__ transactions associated with this account. */
	pending: number;
	/** The combined sum of validated and unvalidated transaction associated with this account. */
	working: number;
};

/**
 * Deletes a user account.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param accountId The ID of the account to aggregate balance for.
 * @returns The account balance object.
 */
export function getUserAccountBalance(
	database: Database,
	userId: string,
	accountId: number,
): AccountBalance {
	const result = database
		.select({
			validated: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 1 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`,
			pending: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 0 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`
		})
		.from(schema.userTransaction)
		.where(
			and(
				eq(schema.userTransaction.accountId, accountId),
				eq(schema.userTransaction.userId, userId)
			)
		)
		.get();

	if (!result) throw new Error(`Account with id (${accountId}) not found.`);

	return {
		...result,
		working: result.validated + result.pending
	};
}

/**
 * Retrieves all user accounts with their corresponding balance for a given user.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @returns An array of user account rows with their balance.
 */
export function getUserAccountsWithBalance(
	database: Database,
	userId: string
): Array<typeof schema.userAccount.$inferSelect & AccountBalance> {
	const rows = database
		.select({
			account: schema.userAccount,
			validated: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 1 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`,
			pending: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 0 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`
		})
		.from(schema.userAccount)
		.leftJoin(
			schema.userTransaction,
			eq(schema.userTransaction.accountId, schema.userAccount.id)
		)
		.where(eq(schema.userAccount.userId, userId))
		.groupBy(({ account }) => account.id)
		.all();

	return rows.map(({ account, validated, pending }) => ({
		...account,
		validated,
		pending,
		working: validated + pending
	}));
}
