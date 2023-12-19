import { auth, createUser, isNameAlreadyInUse } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fail, type Actions, redirect } from '@sveltejs/kit';

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!password || !username) {
			return fail(400, { error: 'Please provide a username and password.' });
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must have a minimum of 8 characters.'
			});
		}

		try {
			const { session } = await createUser(db, auth, username, password);
			locals.auth.setSession(session);
		} catch (error) {
			if (isNameAlreadyInUse(error)) {
				return fail(400, {
					username,
					password,
					error: 'Username is already in use.'
				});
			}

			return fail(500, { username, error: 'Something went wrong, oops.' });
		}

		redirect(302, '/');
	}
} satisfies Actions;
