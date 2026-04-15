import { withPermissions } from '$db/actions';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { createCategorySchema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, _actions, _event: PageServerLoadEvent) => {
		return {
			form: await superValidate(zod4(createCategorySchema))
		};
	}
);

export const actions = {
	default: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(createCategorySchema));
		if (!form.valid) return fail(400, { form });

		const { categoryName } = form.data;

		actions.category.create({ budgetId: event.params.budgetId, name: categoryName });

		redirect(303, `/${event.params.budgetId}`);
	})
} satisfies Actions;
