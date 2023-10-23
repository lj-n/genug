import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

export function createUserCategory(
	userId: string,
	name: string,
	description?: string
) {
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

export function getUserCategories(userId: string) {
	return db
		.select()
		.from(schema.userCategory)
		.where(eq(schema.userCategory.userId, userId))
		.all();
}

export function getUserCategory(userId: string, id: number) {
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

export function deleteUserCategory(userId: string, id: number) {
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
