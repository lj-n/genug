import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { relations } from './relations';

export type Database = ReturnType<typeof createDatabase>;

/**
 * Creates a database connection using the provided URL, runs any pending migrations, and returns the database instance.
 */
export function createDatabase(url: string) {
	const client = new SQLiteDatabase(url);
	const db = drizzle({ client, relations });
	migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
	return db;
}
