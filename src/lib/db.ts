import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const pool = new Pool({
	connectionString: 'postgres://myuser:mypassword@localhost:5432/mydb'
});

export const db = drizzle(pool);
