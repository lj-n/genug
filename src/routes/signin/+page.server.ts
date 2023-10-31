import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { useUserAuth } from '$lib/server/user';
import { LuciaError } from 'lucia';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		throw redirect(302, '/');
	}
};

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Please provide a username and password.' });
		}

		try {
			const { login } = useUserAuth();
			const session = await login(username, password);
			locals.auth.setSession(session);
		} catch (error) {
			if (error instanceof LuciaError) {
				return fail(401, {
					username,
					error: 'You have entered an invalid username or password.'
				});
			}

			return fail(500, { username, error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
