import {
	drizzle,
	type BetterSQLite3Database
} from 'drizzle-orm/better-sqlite3';
import SQLiteDatabase from 'better-sqlite3';
import { schema } from '$lib/server/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export type Database = BetterSQLite3Database<typeof schema>;

export const sqlite = new SQLiteDatabase('data/genug.db');

export const db: Database = drizzle(sqlite, {
	schema,
	logger: false
});

migrate(db, { migrationsFolder: 'migrations' });
