import { redirect, type Actions, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (!session) throw redirect(302, '/signin');
	if (!session.user.emailVerified) throw redirect(302, '/email-verification');

	return session.user;
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();

		if (!session) return fail(401);

		await auth.invalidateSession(session.sessionId);

		locals.auth.setSession(null);

		throw redirect(302, '/signin');
	}
};
