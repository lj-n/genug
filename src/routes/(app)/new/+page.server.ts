import { withPermissions } from '$db/actions';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { schema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, actions, _event: PageServerLoadEvent) => {
		const isFirstBudget = actions.budget.all().length === 0;
		return { form: await superValidate(zod4(schema)), isFirstBudget };
	}
);

export const actions = {
	default: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const { budgetName } = form.data;

		const budget = actions.budget.create({ name: budgetName });

		redirect(303, `/${budget.id}`);
	})
} satisfies Actions;
