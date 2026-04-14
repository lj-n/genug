import { withPermissions } from '$db/actions';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { schema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (user, actions, event: PageServerLoadEvent) => {
		const { budget } = await event.parent();

		return {
			form: await superValidate(zod4(schema)),
			isFirstAccount: budget.accounts.length === 0
		};
	}
);

export const actions = {
	default: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const { accountName } = form.data;

		const account = actions.account.create({ budgetId: event.params.budget, name: accountName });

		redirect(303, `/${event.params.budget}?newAccount=${account.id}`);
	})
} satisfies Actions;
