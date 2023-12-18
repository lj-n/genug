import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/schema/*',
	out: './migrations',
	driver: 'better-sqlite',
	dbCredentials: {
		url: './data/genug.db'
	},
	verbose: true
} satisfies Config;
