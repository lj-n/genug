// PROTOTYPE (#354) — dev-only auto-login for the token-switcher preview pane. Throwaway, do not ship.
import { dev } from '$app/environment';
import { createSession, database, setSessionCookie } from '$db';
import { error, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	if (!dev) error(404);

	const user = await database.query.users.findFirst();
	if (!user) error(500, 'no user in local.db');

	const {
		session: { expiresAt },
		sessionToken
	} = createSession({ userId: user.id });
	setSessionCookie({ cookies, expiresAt, sessionToken });

	redirect(303, '/');
};
