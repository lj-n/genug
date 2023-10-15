import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { libsql } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';

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
