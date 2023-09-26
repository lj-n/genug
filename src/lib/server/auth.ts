import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { pg } from '@lucia-auth/adapter-postgresql';

import { pool } from './db';
import { dev } from '$app/environment';

export const auth = lucia({
	env: dev ? 'DEV' : 'PROD',
	adapter: pg(pool, {
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
