import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { generateId } from 'lucia';

import { schema } from '$lib/server/schema';
import { createAuth } from '$lib/server/auth';

/**
 * Creates and initializes a test database for unit testing.
 * @returns An object containing the database, authentication client, test user, and a close function.
 */
export function useTestDatabase() {
	/** Create a temporary database in memory */
	const client = new SQLiteDatabase(':memory:');
	/** Create the orm instance */
	const database = drizzle(client, { schema });

	/** Run database migrations */
	migrate(database, { migrationsFolder: 'migrations' });

	/** Create an auth client */
	const auth = createAuth(client);

	/** Create a test user */
	const testUser = database
		.insert(schema.user)
		.values({
			id: generateId(15),
			name: 'Test User',
			hashedPassword: '1234567890'
		})
		.returning()
		.get();

	/** Create a second test user */
	const testUser2 = database
		.insert(schema.user)
		.values({
			id: generateId(15),
			name: 'Test User 2',
			hashedPassword: '1234567890'
		})
		.returning()
		.get();

	return {
		database,
		auth,
		testUser,
		testUser2,
		client
	} as const;
}
