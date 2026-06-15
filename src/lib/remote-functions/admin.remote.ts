import { form, query } from '$app/server';
import {
	createUser as createDbUser,
	database,
	deleteSessionCookie,
	deleteUser,
	getAllUsers,
	hashPassword,
	setPassword
} from '$db';
import { deleteDatabase } from '$db/delete-database';
import { m } from '$lib/paraglide/messages';
import { UserIdSchema, UsernameChangeSchema } from '$lib/schemas/user';
import { createId } from '$server/utils/create-id';
import { isSqliteUniqueConstraintError } from '$server/utils/is-sqlite-unique-constraint-error';
import { error, invalid, redirect } from '@sveltejs/kit';

import { requireAdmin } from './remote.utils';

export const getUsers = query(async () => {
	requireAdmin();
	return getAllUsers();
});

export const resetUserPassword = form(UserIdSchema, async ({ userId }) => {
	const [admin] = requireAdmin();
	if (userId === admin.id) error(400);

	const newPassword = createId();
	setPassword({ password: newPassword, userId });
	return { newPassword };
});

export const removeUser = form(UserIdSchema, async ({ userId }) => {
	const [admin] = requireAdmin();
	if (userId === admin.id) error(400);
	deleteUser({ userId });
});

export const createUser = form(UsernameChangeSchema, async ({ username }, issue) => {
	requireAdmin();

	const password = createId();
	const passwordHash = await hashPassword({ password });

	try {
		createDbUser({ passwordHash, username });
	} catch (error) {
		if (isSqliteUniqueConstraintError(error)) {
			invalid(issue.username(m.user_error_duplicate_name({ value: username })));
		}
	}

	return { password };
});

export const resetDatabase = form(async () => {
	const [_admin, event] = requireAdmin();

	deleteSessionCookie(event);
	deleteDatabase(database);

	redirect(302, '/login');
});
