import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { generateRandomString } from 'lucia/utils';

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
			id: generateRandomString(15),
			name: 'Test User'
		})
		.returning()
		.get();

	return {
		database,
		auth,
		testUser,
		client
	} as const;
}
