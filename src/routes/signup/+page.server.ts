import { auth } from '$lib/auth';
import { sendEmailVerificationLink } from '$lib/email';
import { generateEmailVerificationToken } from '$lib/token';
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
			const user = await auth.createUser({
				key: {
					providerId: 'email',
					providerUserId: email.toLowerCase(),
					password
				},
				attributes: {
					email: email.toLowerCase(),
					email_verified: Number(false),
					name: username
				}
			});

			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session);

			const token = await generateEmailVerificationToken(user.userId);

			await sendEmailVerificationLink(token);
		} catch (e) {
			console.log('🛸 < e =', e);

			return fail(500, { error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
