import { auth } from '$lib/auth';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (!session) return {}; // proceed
	if (!session.user.email_verified) throw redirect(302, '/email-verification');

	throw redirect(302, '/');
};

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Missing stuff..' });
		}

		try {
			const key = await auth.useKey('email', email.toLowerCase(), password);

			const session = await auth.createSession({
				userId: key.userId,
				attributes: {}
			});

			locals.auth.setSession(session);
		} catch (e) {
			console.log('🛸 < e =', e);

			return fail(500, { error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
