import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/schema/*',
	out: './drizzle',
	driver: 'better-sqlite',
	dbCredentials: {
		url: './genug.db'
	},
	verbose: true
} satisfies Config;
