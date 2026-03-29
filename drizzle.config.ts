import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
	dbCredentials: { url: process.env.DATABASE_URL },
	dialect: 'sqlite',
	out: './src/lib/server/db/migrations',
	schema: './src/lib/server/db/tables/index.ts',
	strict: true,
	verbose: true
});
