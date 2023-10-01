import { redirect, type Actions, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth, protectRoute } from '$lib/server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await protectRoute(locals);

	return { user };
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();

		if (!session) return fail(401);

		await auth.invalidateSession(session.sessionId);

		locals.auth.setSession(null);

		throw redirect(302, '/signin');
	}
};
