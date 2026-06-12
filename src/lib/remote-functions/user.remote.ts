import { form, query } from '$app/server';
import { actions } from '$db';
import { InvalidCredentialsError } from '$db/auth.utils';
import { m } from '$lib/paraglide/messages';
import { PasswordChangeSchema, UsernameChangeSchema } from '$lib/schemas/user';
import { isSqliteUniqueConstraintError } from '$server/utils/is-sqlite-unique-constraint-error';
import { invalid } from '@sveltejs/kit';

import { requireUser } from './remote.utils';

export const getUser = query(async () => {
	const [user] = requireUser();
	return user;
});

export const changeUsername = form(UsernameChangeSchema, async ({ username }, issue) => {
	const [user] = requireUser();

	try {
		actions.user.setUsername({ userId: user.id, username });
	} catch (error) {
		if (isSqliteUniqueConstraintError(error)) {
			invalid(issue.username(m.user_error_duplicate_name({ value: username })));
		}
	}
});

export const changePassword = form(
	PasswordChangeSchema,
	async ({ _oldPassword, _password }, issue) => {
		const [user, event] = requireUser();

		try {
			await actions.auth.authenticateUser({ password: _oldPassword, username: user.username });
		} catch (error) {
			if (error instanceof InvalidCredentialsError) {
				invalid(issue._oldPassword(m.login_error_invalid_credentials()));
			}
		}

		actions.user.setPassword({ password: _password, userId: user.id });
		actions.auth.deleteUserSessions({ userId: user.id });
		actions.auth.deleteSessionCookie(event);
	}
);
