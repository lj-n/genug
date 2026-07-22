/**
 * PROTOTYPE (#256) — throwaway, delete with the palette prototype files.
 *
 * Dev-only convenience: GET /palette-prototype-login signs the browser in as
 * the first user in local.db and redirects to the app root, so the prototype
 * preview pane reaches the reference screen without credentials.
 */
import { dev } from '$app/environment';
import { createSession, database, setSessionCookie } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	if (!dev) error(404, 'Not found');

	const user = await database.query.users.findFirst();
	if (!user) error(500, 'No user in local.db to impersonate');

	const { session, sessionToken } = createSession({ userId: user.id });
	setSessionCookie({ cookies, expiresAt: session.expiresAt, sessionToken });

	redirect(302, '/');
};
