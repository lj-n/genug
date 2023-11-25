import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import type { Database } from 'better-sqlite3';

import { dev } from '$app/environment';
import { sqlite } from '../db';

/**
 * Creates an authentication instance using the provided database client.
 *
 * @param client The database client to be used for authentication.
 * @returns An instance of the authentication module.
 */
export function createAuth(client: Database) {
	return lucia({
		env: dev ? 'DEV' : 'PROD',
		adapter: betterSqlite3(client, {
			user: 'user',
			key: 'user_key',
			session: 'user_session'
		}),
		middleware: sveltekit(),
		getUserAttributes: (user) => ({ name: user.name })
	});
}

export const auth = createAuth(sqlite);
export type Auth = ReturnType<typeof createAuth>;
