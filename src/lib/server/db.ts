import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import PG from 'pg';
import * as schema from './schema';

export const pool = new PG.Pool({
	connectionString: DATABASE_URL
});

export const db = drizzle(pool, { schema });
