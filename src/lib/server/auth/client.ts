import type { Cookies } from '@sveltejs/kit';
import { Lucia, TimeSpan, type Session } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
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
	const adapter = new BetterSqlite3Adapter(client, {
		user: 'user',
		session: 'user_session'
	});

	return new Lucia(adapter, {
		sessionCookie: { attributes: { secure: !dev } },
		sessionExpiresIn: new TimeSpan(30, 'd'),
		getUserAttributes: (user) => ({ name: user.name })
	});
}

export const auth = createAuth(sqlite);

/**
 * Sets the session cookie in sveltekit handlers.
 *
 * @param cookies - The cookies object to set the session cookie on.
 * @param session - The session object containing the session ID.
 */
export function setSvelteKitSessionCookie(cookies: Cookies, session: Session) {
	const sessionCookie = auth.createSessionCookie(session.id);
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
}

/**
 * Deletes the SvelteKit session cookie.
 *
 * @param cookies - The cookies object used to set the session cookie.
 */
export function deleteSvelteKitSessionCookie(cookies: Cookies) {
	const sessionCookie = auth.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
}

export type Auth = ReturnType<typeof createAuth>;

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof createAuth>;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	name: string;
}
