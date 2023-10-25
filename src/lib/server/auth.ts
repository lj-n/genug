import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';
import {
	redirect,
	type ServerLoadEvent,
	type RequestEvent
} from '@sveltejs/kit';

import { sqlite } from './db';
import { User } from './user';

export const auth = lucia({
	env: dev ? 'DEV' : 'PROD',
	adapter: betterSqlite3(sqlite, {
		user: 'user',
		key: 'user_key',
		session: 'user_session'
	}),
	middleware: sveltekit(),
	getUserAttributes: (user) => ({
		email: user.email,
		emailVerified: Boolean(user.email_verified),
		name: user.name
	})
});

export type Auth = typeof auth;

/** Use to protect Server routes */
export function withAuth<Event extends ServerLoadEvent | RequestEvent, Out>(
	fn: (event: Event, user: User) => Out,
	{ redirectTo = '/signin' }: { redirectTo?: string } = {}
) {
	return async (event: Event): Promise<Out> => {
		const session = await event.locals.auth.validate();
		if (!session) throw redirect(302, redirectTo);

		const user = new User(session.user.userId);

		return fn(event, user);
	};
}
