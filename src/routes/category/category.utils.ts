import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

export async function createUserCategory(
	userId: string,
	name: string,
	description?: string
) {
	const [category] = await db
		.insert(schema.userCategory)
		.values({
			userId,
			name,
			description
		})
		.returning();

	return category;
}

export async function getUserCategories(userId: string) {
	return db.query.userCategory.findMany({
		where: (userCategory, { eq }) => eq(userCategory.userId, userId),
		with: {
			transactions: true
		}
	});
}

export async function getUserCategory(userId: string, id: number) {
	return db.query.userCategory.findFirst({
		where: (userCategory, { eq, and }) => {
			return and(eq(userCategory.id, id), eq(userCategory.userId, userId));
		},
		with: {
			transactions: true
		}
	});
}

export async function deleteUserCategory(userId: string, id: number) {
	await db
		.delete(schema.userCategory)
		.where(
			and(
				eq(schema.userCategory.id, id),
				eq(schema.userCategory.userId, userId)
			)
		);
}
