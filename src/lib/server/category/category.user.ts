import { and, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { schema } from '../schema';

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
