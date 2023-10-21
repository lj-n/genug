import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/schema/*',
	out: './database'
} satisfies Config;
