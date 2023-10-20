import { dev } from '$app/environment';
import { auth, generateToken, sendEmailVerificationLink } from '$lib/server';
import { createUser } from '$lib/server/user';
import { fail, type Actions, redirect } from '@sveltejs/kit';

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password || !username) {
			return fail(400, { error: 'Missing stuff..' });
		}

		try {
			const user = await createUser(email, username, password, dev);

			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});

			locals.auth.setSession(session);

			const token = await generateToken(user.userId);
			await sendEmailVerificationLink(user, token);
		} catch (_e) {
			return fail(500, { error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
