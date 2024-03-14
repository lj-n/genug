import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db';
import { schema } from '../schema';
import { getPreviousMonthsWithNames } from '$lib/components/date.utils';

/**
 * Retrieves a user category from the database based on the provided user ID and category ID.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @returns The selected user category or undefined if not found.
 */
export function getUserCategory(
	database: Database,
	userId: string,
	categoryId: number
): typeof schema.userCategory.$inferSelect | undefined {
	return database
		.select()
		.from(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, categoryId)
			)
		)
		.get();
}

/**
 * Retrieves all user categories from the database based on the provided user ID.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @returns An array of selected user categories.
 */
export function getUserCategories(
	database: Database,
	userId: string
): Array<typeof schema.userCategory.$inferSelect> {
	return database
		.select()
		.from(schema.userCategory)
		.where(eq(schema.userCategory.userId, userId))
		.all();
}

/**
 * Creates a new user category in the database.
 * @param database The database instance.
 * @param draft The draft object containing the data for the new user category.
 * @returns The created user category.
 */
export function createUserCategory(
	database: Database,
	draft: typeof schema.userCategory.$inferInsert
): typeof schema.userCategory.$inferSelect {
	return database.insert(schema.userCategory).values(draft).returning().get();
}

/**
 * Updates a user category in the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @param update The partial update object containing the data to be updated.
 * @returns The updated user category.
 * @throws Error if the category with the specified ID is not found.
 */
export function updateUserCategory(
	database: Database,
	userId: string,
	categoryId: number,
	update: Partial<
		Omit<typeof schema.userCategory.$inferInsert, 'userId' | 'id'>
	>
): typeof schema.userCategory.$inferSelect {
	const category = database
		.update(schema.userCategory)
		.set(update)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, categoryId)
			)
		)
		.returning()
		.get();

	if (!category) throw new Error(`Category with id (${categoryId}) not found.`);

	return category;
}

/**
 * Deletes a user category from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @returns The deleted user category.
 * @throws Error if the category with the specified ID is not found.
 */
export function deleteUserCategory(
	database: Database,
	userId: string,
	categoryId: number
): typeof schema.userCategory.$inferSelect {
	const category = database
		.delete(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, categoryId)
			)
		)
		.returning()
		.get();

	if (!category) throw new Error(`Category with id (${categoryId}) not found.`);

	return category;
}

/**
 * Retrieves transaction information for a specific user category from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @returns An object containing the count and sum of transactions for the user category.
 * @throws Error if the category with the specified ID is not found.
 */
export function getUserCategoryTransactionInfo(
	database: Database,
	userId: string,
	categoryId: number
): {
	count: number;
	sum: number;
} {
	const result = database
		.select({
			count: sql<number>`coalesce(count(${schema.transaction.flow}), 0)`,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`
		})
		.from(schema.category)
		.leftJoin(
			schema.transaction,
			eq(schema.transaction.categoryId, schema.category.id)
		)
		.where(
			and(
				eq(schema.category.userId, userId),
				eq(schema.category.id, categoryId)
			)
		)
		.get();

	if (!result) throw new Error(`Category with id (${categoryId}) not found.`);

	return result;
}

/**
 * Retrieves the sum of the budgets for a specific user category from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @returns The sum of the budgets for the user category.
 * @throws Error if the category with the specified ID is not found.
 */
export function getUserCategoryBudgetSum(
	database: Database,
	userId: string,
	categoryId: number
): number {
	const result = database
		.select({
			sum: sql<number>`coalesce(sum(${schema.userBudget.amount}), 0)`
		})
		.from(schema.userCategory)
		.leftJoin(
			schema.userBudget,
			eq(schema.userBudget.categoryId, schema.userCategory.id)
		)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, categoryId)
			)
		)
		.get();

	if (!result) throw new Error(`Category with id (${categoryId}) not found.`);

	return result.sum;
}

/**
 * Retrieves transaction information for a specific user category and month from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @param month The month in the format 'YYYY-MM'.
 * @returns An object containing the sum and count of transactions for the user category and month.
 * @throws Error if the category with the specified ID is not found.
 */
export function getUserCategoryTransactionInfoForMonth(
	database: Database,
	userId: string,
	categoryId: number,
	month: string
) {
	const result = database
		.select({
			sum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`,
			count: sql<number>`coalesce(count(${schema.userTransaction.flow}), 0)`
		})
		.from(schema.userTransaction)
		.where(
			and(
				eq(schema.userTransaction.userId, userId),
				eq(schema.userTransaction.categoryId, categoryId),
				eq(sql`strftime('%Y-%m', ${schema.userTransaction.date})`, month)
			)
		)
		.get();

	if (!result) throw new Error(`Category with id (${categoryId}) not found.`);

	return result;
}

/**
 * Retrieves the transaction information for the last N months for a specific user category from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param categoryId The ID of the category.
 * @param n The number of previous months to retrieve transaction information for.
 * @returns An array of objects containing the name, date, count, and sum of transactions for each month.
 * @throws Error if the category with the specified ID is not found.
 */
export function getUserCategoryLastMonthStats(
	database: Database,
	userId: string,
	categoryId: number,
	n: number
) {
	return getPreviousMonthsWithNames(n).map(({ name, date }) => {
		return {
			name,
			date,
			...getUserCategoryTransactionInfoForMonth(
				database,
				userId,
				categoryId,
				date
			)
		};
	});
}
