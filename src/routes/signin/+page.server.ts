import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	auth,
	createUserSession,
	setSvelteKitSessionCookie
} from '$lib/server/auth';
import { db } from '$lib/server/db';

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

		if (!username || !password) {
			return fail(400, {
				username,
				error: 'Please provide a username and password.'
			});
		}

		try {
			const session = await createUserSession(db, auth, username, password);
			setSvelteKitSessionCookie(cookies, session);
		} catch (err) {
			return fail(401, {
				username,
				error: 'You have entered an invalid username or password.'
			});
		}

		redirect(302, '/');
	}
} satisfies Actions;
