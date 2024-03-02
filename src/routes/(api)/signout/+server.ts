import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth, deleteSvelteKitSessionCookie } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		await auth.invalidateUserSessions(locals.user.id);
		deleteSvelteKitSessionCookie(cookies);
	}

	redirect(302, '/signin');
};
