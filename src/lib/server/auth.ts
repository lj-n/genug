import { lucia, type User } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { libsql } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';

import { libsqlClient } from './db';

export const auth = lucia({
	env: dev ? 'DEV' : 'PROD',
	adapter: libsql(libsqlClient, {
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

/**
 * Checks if a valid user/session exists.
 * If not, redirects to the signin page.
 * @returns The user.
 */
export async function protectRoute(locals: App.Locals): Promise<User> {
	const session = await locals.auth.validate();

	if (!session) throw redirect(302, '/signin');
	if (!session.user.emailVerified) throw redirect(302, '/email-verification');

	return session.user;
}
