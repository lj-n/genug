import { generateId, LegacyScrypt, type Session, type User } from 'lucia';
import type { Auth } from '../auth';
import type { Database } from '../db';
import { schema } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Creates a new user in the database and returns the user object and session.
 * @param database The database instance.
 * @param auth The authentication instance.
 * @param username The username of the new user.
 * @param password The password of the new user.
 * @returns A promise that resolves to an object containing the user and session.
 */
export async function createUser(
	database: Database,
	auth: Auth,
	username: string,
	password: string
): Promise<{ user: User; session: Session }> {
	return database.transaction(async () => {
		const userId = generateId(15);

		const user = database
			.insert(schema.user)
			.values({
				id: userId,
				name: username,
				hashedPassword: await new LegacyScrypt().hash(password)
			})
			.returning()
			.get();

		database
			.insert(schema.userSettings)
			.values({
				userId
			})
			.returning()
			.get();

		const session = await auth.createSession(userId, {});

		return { user, session };
	});
}

/**
 * Creates a new user session using the provided authentication credentials.
 * @param database The database instance.
 * @param auth The authentication instance.
 * @param username The username of the user.
 * @param password The password of the user.
 * @returns A promise that resolves to the created session.
 */
export async function createUserSession(
	database: Database,
	auth: Auth,
	username: string,
	password: string
): Promise<Session> {
	const user = database
		.select()
		.from(schema.user)
		.where(eq(schema.user.name, username))
		.get();

	if (!user) throw new Error('User not found.');

	const validPassword = await new LegacyScrypt().verify(
		user.hashedPassword,
		password
	);

	if (!validPassword) throw new Error('Invalid username or password.');

	return await auth.createSession(user.id, {});
}

/**
 * Deletes a user from the database and returns the deleted user's ID.
 * @param database The database instance.
 * @param userId The ID of the user to delete.
 * @returns The ID of the deleted user.
 * @throws Error if the user with the specified ID is not found.
 */
export function deleteUser(database: Database, userId: string): string {
	/**
	 * TODO: Delete all user data (accounts, categories, etc.) or use delete cascade.
	 */
	const row = database
		.delete(schema.user)
		.where(eq(schema.user.id, userId))
		.returning()
		.get();

	if (!row) throw new Error(`User with id (${userId}) not found.`);

	return row.id;
}

/**
 * Retrieves the user profile from the database based on the user ID.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @returns The user profile object.
 * @throws Error if the user with the specified ID is not found.
 */
export function getUserSettings(
	database: Database,
	userId: string
): Omit<typeof schema.userSettings.$inferSelect, 'id'> {
	const profile = database
		.select({
			theme: schema.userSettings.theme,
			categoryOrder: schema.userSettings.categoryOrder,
			userId: schema.userSettings.userId
		})
		.from(schema.userSettings)
		.where(eq(schema.userSettings.userId, userId))
		.get();

	if (!profile) throw new Error(`User with id (${userId}) not found.`);

	return profile;
}

/**
 * Updates the user profile in the database based on the user ID.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param updates The updates to be applied to the user profile.
 * @returns The updated user profile object.
 * @throws Error if the user with the specified ID is not found.
 */
export function updateUserSettings(
	database: Database,
	userId: string,
	updates: Omit<typeof schema.userSettings.$inferInsert, 'userId' | 'id'>
): typeof schema.userSettings.$inferSelect {
	const profile = database
		.update(schema.userSettings)
		.set(updates)
		.where(eq(schema.userSettings.userId, userId))
		.returning()
		.get();

	if (!profile) throw new Error(`User with id (${userId}) not found.`);

	return profile;
}

/**
 * Sets the avatar for a user in the database.
 * 
 * @param database - The database instance.
 * @param userId - The ID of the user.
 * @param data - The avatar data, including the image buffer and image type.
 * @throws Error if the user with the given ID is not found.
 */
export function setUserAvatar(
	database: Database,
	userId: string,
	data: { image: Buffer; imageType: string } | null
): void {
	const avatar = database
		.insert(schema.userAvatar)
		.values({
			userId,
			image: data?.image || null,
			imageType: data?.imageType || null
		})
		.onConflictDoUpdate({
			target: [schema.userAvatar.userId],
			set: { image: data?.image || null, imageType: data?.imageType || null }
		})
		.returning()
		.get();

	if (!avatar) throw new Error(`User with id (${userId}) not found.`);
}

/**
 * Sets the password for a user in the database.
 * @param database - The database instance.
 * @param userId - The ID of the user.
 * @param password - The new password for the user.
 * @throws Error if the user with the given ID is not found.
 */
export async function setUserPassword(
	database: Database,
	userId: string,
	password: string
) {
	const user = database
		.update(schema.user)
		.set({ hashedPassword: await new LegacyScrypt().hash(password) })
		.where(eq(schema.user.id, userId))
		.returning()
		.get();

	if (!user) throw new Error(`User with id (${userId}) not found.`);
}
