import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (session) {
		await auth.invalidateAllUserSessions(session.sessionId);
		locals.auth.setSession(null);
	}

	throw redirect(302, '/signin');
};
