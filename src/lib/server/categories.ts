import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import type { UserCategory } from './schema/tables';

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

export function getUserCategory(
	userId: string,
	id: number
): UserCategory | undefined {
	return db
		.select()
		.from(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.id, id)
			)
		)
		.get();
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
