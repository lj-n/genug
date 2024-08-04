import type { Actions, PageServerLoad } from './$types.js';
import { superValidate } from 'sveltekit-superforms';
import { formSchema } from './schema.js';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { createUser, createUserSession } from '$lib/server/auth/user.js';
import { db } from '$lib/server/db.js';
import { auth, deleteSvelteKitSessionCookie, setSvelteKitSessionCookie } from '$lib/server/auth/client.js';
import { isNameAlreadyInUse } from '$lib/server/auth/utils.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions = {
	async login(event) {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const session = await createUserSession(
				db,
				auth,
				form.data.username,
				form.data.password
			);
			setSvelteKitSessionCookie(event.cookies, session);
		} catch (err) {
			form.errors.username = [
				'You have entered an invalid username or password.'
			];
			return fail(401, { form });
		}

		redirect(302, '/');
	},

	async signup(event) {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const { session } = await createUser(
				db,
				auth,
				form.data.username,
				form.data.password
			);
			setSvelteKitSessionCookie(event.cookies, session);
		} catch (error) {
			if (isNameAlreadyInUse(error)) {
				form.errors.username = ['Username is already in use.'];
				return fail(400, { form });
			}
			form.errors.username = ['Something went wrong, sorry.'];
			return fail(500, { form });
		}

		redirect(302, '/');
	},

	async signout(event) {
		if (event.locals.user) {
			await auth.invalidateUserSessions(event.locals.user.id);
			deleteSvelteKitSessionCookie(event.cookies);
		}
	
		redirect(302, '/authenticate');
	}
} satisfies Actions;
