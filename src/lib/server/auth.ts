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
import { userClient } from './user';

export const auth = lucia({
	env: dev ? 'DEV' : 'PROD',
	adapter: betterSqlite3(sqlite, {
		user: 'user',
		key: 'user_key',
		session: 'user_session'
	}),
	middleware: sveltekit(),
	getUserAttributes: (user) => ({ name: user.name })
});

export type Auth = typeof auth;

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
