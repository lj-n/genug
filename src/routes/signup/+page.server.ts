import {
	auth,
	createUser,
	isNameAlreadyInUse,
	setSvelteKitSessionCookie
} from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
};

export const actions = {
	async default({ request, cookies }) {
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
			setSvelteKitSessionCookie(cookies, session);
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
