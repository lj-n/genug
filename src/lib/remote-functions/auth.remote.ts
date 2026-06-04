import { form, getRequestEvent, query } from '$app/server';
import { actions } from '$db';
import { createUser, isFirstUser } from '$db/user';
import { m } from '$lib/paraglide/messages';
import { LoginSchema, RegisterSchema } from '$lib/schemas/auth';
import { type Cookies, error, invalid, redirect } from '@sveltejs/kit';

export const login = form(LoginSchema, async ({ _password, username }, issue) => {
	const { cookies } = getRequestEvent();

	try {
		const user = await actions.auth.authenticateUser({ password: _password, username });
		createAndSetSession({ cookies, userId: user.id });
	} catch (_error) {
		invalid(issue(m.login_error_invalid_credentials()));
	}

	redirect(303, '/');
});

export const getIsFirstUser = query(isFirstUser);

export const register = form(RegisterSchema, async ({ _password, username }) => {
	const { cookies } = getRequestEvent();
	const isFirst = await isFirstUser();

	if (!isFirst) error(401);

	const passwordHash = await actions.auth.hashPassword({ password: _password });
	const user = createUser({ passwordHash, username });
	createAndSetSession({ cookies, userId: user.id });

	if (isFirst) redirect(302, '/');
});

export const signout = form(async () => {
	const { cookies, locals } = getRequestEvent();
	if (!locals.session) error(401);
	actions.auth.deleteSession({ sessionId: locals.session.id });
	actions.auth.deleteSessionCookie({ cookies });
});

function createAndSetSession({ cookies, userId }: { cookies: Cookies; userId: string }) {
	const {
		session: { expiresAt },
		sessionToken
	} = actions.auth.createSession({ userId });
	actions.auth.setSessionCookie({ cookies, expiresAt, sessionToken });
}
