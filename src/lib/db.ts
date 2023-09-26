import { drizzle } from 'drizzle-orm/node-postgres';
import PG from 'pg';

export const pool = new PG.Pool({
	connectionString: 'postgres://myuser:mypassword@localhost:5432/mydb'
});

export const db = drizzle(pool);
