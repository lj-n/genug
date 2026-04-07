import { withPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

import { editSchema } from './schema';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = await actions.category.all();

	const category = categories.find((c) => c.id === event.params.categoryId);

	if (!category) error(404, 'Category not found');

	return {
		category,
		editForm: await superValidate(
			{
				name: category.name,
				notes: category.notes,
				targetBalance: category.targetBalance
			},
			zod4(editSchema)
		)
	};
});

export const actions = {
	edit: withPermissions(async (user, actions, event) => {
		const category = await actions.category.getById({ id: event.params.categoryId });
		if (!category) error(404, 'Category not found');

		const form = await superValidate(event.request, zod4(editSchema));
		if (!form.valid) return fail(400, { form });

		console.log(form.data);

		await actions.category.update({
			data: form.data,
			id: event.params.categoryId
		});

		return message(form, { text: m.saved(), type: 'success' });
	})
} satisfies Actions;
