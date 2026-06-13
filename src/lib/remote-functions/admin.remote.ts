import { form, query } from '$app/server';
import { actions, database } from '$db';
import { deleteDatabase } from '$db/delete-database';
import { m } from '$lib/paraglide/messages';
import { UserIdSchema, UsernameChangeSchema } from '$lib/schemas/user';
import { createId } from '$server/utils/create-id';
import { isSqliteUniqueConstraintError } from '$server/utils/is-sqlite-unique-constraint-error';
import { error, invalid, redirect } from '@sveltejs/kit';

import { requireAdmin } from './remote.utils';

export const getUsers = query(async () => {
	requireAdmin();
	return actions.user.getAllUsers();
});

export const resetUserPassword = form(UserIdSchema, async ({ userId }) => {
	const [admin] = requireAdmin();
	if (userId === admin.id) error(400);

	const newPassword = createId();
	actions.user.setPassword({ password: newPassword, userId });
	return { newPassword };
});

export const removeUser = form(UserIdSchema, async ({ userId }) => {
	const [admin] = requireAdmin();
	if (userId === admin.id) error(400);
	actions.user.deleteUser({ userId });
});

export const createUser = form(UsernameChangeSchema, async ({ username }, issue) => {
	requireAdmin();

	const password = createId();
	const passwordHash = await actions.auth.hashPassword({ password });

	try {
		actions.user.createUser({ passwordHash, username });
	} catch (error) {
		if (isSqliteUniqueConstraintError(error)) {
			invalid(issue.username(m.user_error_duplicate_name({ value: username })));
		}
	}

	return { password };
});

export const resetDatabase = form(async () => {
	const [_admin, event] = requireAdmin();

	actions.auth.deleteSessionCookie(event);
	deleteDatabase(database);

	redirect(302, '/login');
});
