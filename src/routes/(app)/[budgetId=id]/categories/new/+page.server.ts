import { withPermissions } from '$db/actions';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions } from './$types';

import { createCategorySchema } from './schema';

export const actions = {
	default: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(createCategorySchema));
		if (!form.valid) return fail(400, { form });

		const { categoryName } = form.data;

		actions.category.create({ budgetId: event.params.budgetId, name: categoryName });

		return message(form, { type: 'success' });
	})
} satisfies Actions;
