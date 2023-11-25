import { LuciaError, lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import { SqliteError, type Database } from 'better-sqlite3';

import { dev } from '$app/environment';
import {
	redirect,
	type ServerLoadEvent,
	type RequestEvent
} from '@sveltejs/kit';

import { sqlite } from './db';
import { userClient } from './user';

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

/** Use to protect Server routes */
export function withAuth<Event extends ServerLoadEvent | RequestEvent, Out>(
	fn: (event: Event, user: ReturnType<typeof userClient>) => Out,
	{ redirectTo = '/signin' }: { redirectTo?: string } = {}
) {
	return async (event: Event): Promise<Out> => {
		const session = await event.locals.auth.validate();
		if (!session) throw redirect(302, redirectTo);

		return fn(event, userClient(session.user.userId));
	};
}

/** Check if error indicates that username is already taken */
export function isNameAlreadyInUse(e: unknown) {
	return (
		(e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
		(e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID')
	);
}
