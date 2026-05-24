import { auth, database, users } from '$db';
import { withAdminPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { createId } from '$server/utils/create-id';
import { isSqliteUniqueConstraintError } from '$server/utils/is-sqlite-unique-constraint-error';
import { fail } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { schemaUserCreate, schemaUserDelete } from './schema';

export const load: PageServerLoad = withAdminPermissions(
	async (user, actions, _event: PageServerLoadEvent) => {
		const users = actions.admin.users();
		return {
			formCreateUser: await superValidate(zod4(schemaUserCreate)),
			formDeleteUser: await superValidate(zod4(schemaUserDelete)),
			users
		};
	}
);

export const actions = {
	createUser: withAdminPermissions(async (_user, actions, event) => {
		const form = await superValidate(event, zod4(schemaUserCreate));
		if (!form.valid) return fail(400, { form });

		const { username } = form.data;

		const password = createId({ length: 12 });

		const passwordHash = await auth.hashPassword({ password });

		try {
			await users.createUser({
				database,
				passwordHash,
				username
			});

			return message(form, { text: password, type: 'success' });
		} catch (error) {
			if (isSqliteUniqueConstraintError(error)) {
				return setError(form, 'username', m.user_error_duplicate_name({ value: username }));
			}

			return message(form, { type: 'error' });
		}
	}),

	removeUser: withAdminPermissions(async (admin, actions, event) => {
		const form = await superValidate(event, zod4(schemaUserDelete));
		if (!form.valid) return fail(400, { form });

		const { userId } = form.data;

		if (userId === admin.id) return fail(500, 'Admin cannot be deleted!');

		actions.admin.removeUser({ userId });

		return message(form, { type: 'success' });
	})
} satisfies Actions;
