import {
	drizzle,
	type BetterSQLite3Database
} from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { schema } from './schema';

const testing = import.meta.env.MODE === 'test';

const databaseFile = testing ? 'database/test.db' : 'database/genug.db';

export const sqlite = new Database(databaseFile);
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
	schema
});
