import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth, validateToken } from '$lib/server';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	return { token };
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const token = formData.get('token');

		if (!token || typeof token !== 'string') {
			return fail(400, { error: 'No token provided' });
		}

		try {
			const userId = await validateToken(token);
			const user = await auth.getUser(userId);

			await auth.invalidateAllUserSessions(user.userId);
			await auth.updateUserAttributes(user.userId, {
				email_verified: Number(true)
			});

			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});

			locals.auth.setSession(session);
		} catch (error) {
			return fail(500, { error: 'Something went wrong, oops.' });
		}
		throw redirect(302, '/');
	}
} satisfies Actions;
