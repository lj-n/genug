import { auth } from '$lib/auth';
import { validateEmailVerificationToken } from '$lib/token';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!params.token) throw error(400, 'Missing token');

	try {
		const userId = await validateEmailVerificationToken(params.token);
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
	} catch (e) {
		console.log('🛸 < e =', e);
		throw error(500, 'Something went wrong, oops.');
	}

	throw redirect(302, '/');
};
