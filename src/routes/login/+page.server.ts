import { auth, database, users } from '$db';
import { m } from '$lib/paraglide/messages';
import { fail, redirect } from '@sveltejs/kit';
import { type Infer, setError, superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, RequestEvent } from './$types';

import { schema } from './schema';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session) {
		redirect(307, '/');
	}

	const [isFirstUser, form] = await Promise.all([
		users.isFirstUser({ database }),
		superValidate(zod4(schema))
	]);

	const title = isFirstUser ? 'Admin Setup' : 'Login';

	return { form, isFirstUser, title };
};

export const actions = {
	firstUser: async (event) => {
		if (event.locals.session) redirect(307, '/');
		const form = await superValidate(event, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const { password, username } = form.data;

		const isFirstUser = await users.isFirstUser({ database });

		if (!isFirstUser) {
			return setError(form, 'username', 'A user already exists. Please log in instead.');
		}

		const passwordHash = await auth.hashPassword({ password });
		const user = await users.createUser({
			database,
			isAdmin: true,
			passwordHash,
			username
		});

		await createAndSetSession({ event, userId: user.id });

		redirect(302, '/');
	},

	login: async (event) => {
		if (event.locals.session) redirect(307, '/');
		const form = await superValidate(event, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const { password, username } = form.data;

		const result = await auth.authenticateUser({
			database,
			password,
			username
		});

		if (!result.ok) {
			return applyAuthError(form, result.error);
		}

		await createAndSetSession({ event, userId: result.data.id });

		redirect(302, '/');
	},

	logout: async (event) => {
		if (!event.locals.session) return fail(401);

		await auth.deleteSession({
			database,
			sessionId: event.locals.session.id
		});
		auth.deleteSessionCookie({ event });

		redirect(302, '/login');
	}
} satisfies Actions;

function applyAuthError(form: SuperValidated<Infer<typeof schema>>, error: auth.AuthFailure) {
	switch (error) {
		case 'INVALID_CREDENTIALS': {
			const msg = m.login_error_invalid_credentials();
			setError(form, 'username', msg);
			return setError(form, 'password', msg);
		}
	}
}

async function createAndSetSession({ event, userId }: { event: RequestEvent; userId: string }) {
	const sessionToken = auth.createSessionToken();
	const { expiresAt } = await auth.createSession({
		database,
		sessionToken,
		userId
	});
	auth.setSessionCookie({ event, expiresAt, sessionToken });
}
