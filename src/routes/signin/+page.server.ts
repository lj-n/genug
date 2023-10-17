import { fail, type Actions, redirect } from '@sveltejs/kit';
import { loginUser } from '$lib/server/user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (!session) return {}; // proceed
	if (!session.user.emailVerified) throw redirect(302, '/email-verification');

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
			const session = await loginUser(email, password);
			locals.auth.setSession(session);
		} catch (_e) {
			return fail(500, { error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
