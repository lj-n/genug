import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import PG from 'pg';

console.log('🛸 < DATABASE_URL =', DATABASE_URL);

export const pool = new PG.Pool({
	connectionString: DATABASE_URL
});

export const db = drizzle(pool);
