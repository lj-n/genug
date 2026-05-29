import { withPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { isSqliteUniqueConstraintError } from '$server/utils/is-sqlite-unique-constraint-error';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

import { schemaChangePassword, schemaUsername } from './schema';

export const load: PageServerLoad = withPermissions(async (user, _actions, _event) => {
	const [changeUsername, changePassword] = await Promise.all([
		superValidate({ username: user.username }, zod4(schemaUsername)),
		superValidate(zod4(schemaChangePassword))
	]);

	return {
		forms: { changePassword, changeUsername },
		title: m.settings_title()
	};
});

export const actions = {
	changePassword: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event, zod4(schemaChangePassword));
		if (!form.valid) return fail(400, { form });

		await actions.user.changePassword(form.data);

		return message(form, { type: 'success' });
	}),

	changeUsername: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event, zod4(schemaUsername));
		if (!form.valid) return fail(400, { form });

		const { username } = form.data;

		try {
			actions.user.changeUsername({ username });
			return message(form, { type: 'success' });
		} catch (error) {
			if (isSqliteUniqueConstraintError(error)) {
				return setError(form, 'username', m.user_error_duplicate_name({ value: username }));
			}

			return message(form, { type: 'error' });
		}
	})
} satisfies Actions;
