import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import type { InsertUserCategory, UserCategory } from './schema/tables';

export function createUserCategory(
	userId: string,
	name: string,
	description?: string
): UserCategory {
	return db
		.insert(schema.userCategory)
		.values({
			userId,
			name,
			description
		})
		.returning()
		.get();
}

export function getUserCategories(userId: string): UserCategory[] {
	return db
		.select()
		.from(schema.userCategory)
		.where(eq(schema.userCategory.userId, userId))
		.all();
}

export function getUserCategory(userId: string, id: number): UserCategory {
	const category = db
		.select()
		.from(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, id)
			)
		)
		.get();

	if (!category) {
		throw new Error('category not found');
	}

	return category;
}

export function deleteUserCategory(
	userId: string,
	id: number
): UserCategory | undefined {
	return db
		.delete(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.id, id),
				eq(schema.userCategory.userId, userId)
			)
		)
		.returning()
		.get();
}

export function updateUserCategory(
	categoryId: number,
	updates: Partial<Omit<InsertUserCategory, 'id' | 'userId'>>
) {
	const updatedCategory = db
		.update(schema.userCategory)
		.set(updates)
		.where(eq(schema.userCategory.id, categoryId))
		.returning()
		.get();

	if (!updatedCategory) {
		throw new Error(`Could not update category with id (${categoryId})`);
	}

	return updatedCategory;
}
