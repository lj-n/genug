import { withPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { isSqliteUniqueConstraintError } from '$lib/server/utils/is-sqlite-unique-constraint-error';
import { getLocalTimeZone, today } from '@internationalized/date';
import { fail } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { createAccountSchema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, _actions, event: PageServerLoadEvent) => {
		const { budget } = await event.parent();

		return {
			form: await superValidate(zod4(createAccountSchema)),
			isFirstAccount: budget.accounts.length === 0
		};
	}
);

export const actions = {
	default: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(createAccountSchema));
		if (!form.valid) return fail(400, { form });

		const { accountName, startingBalance } = form.data;

		try {
			const account = actions.account.create({
				budgetId: event.params.budgetId,
				name: accountName
			});

			const currentDate = today(getLocalTimeZone());

			actions.transaction.create({
				accountId: account.id,
				amount: startingBalance,
				budgetId: event.params.budgetId,
				date: currentDate.toString(),
				notes: m.account_create_starting_balance(),
				validated: true
			});

			return message(form, { text: account.id, type: 'success' });
		} catch (error) {
			if (isSqliteUniqueConstraintError(error)) {
				return setError(form, 'accountName', m.account_error_duplicate_name());
			}

			return message(form, { type: 'error' });
		}
	})
} satisfies Actions;
