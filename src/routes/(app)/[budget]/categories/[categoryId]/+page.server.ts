import { withPermissions } from '$db/actions';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

import { editSchema } from './schema';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = await actions.category.all();

	const category = categories.find((c) => c.id === event.params.categoryId);

	if (!category) error(404, 'Category not found');

	return { category };
});

export const actions = {
	edit: withPermissions(async (_user, actions, event) => {
		const category = await actions.category.getById({ id: event.params.categoryId });
		if (!category) error(404, 'Category not found');

		const form = await superValidate(event.request, zod4(editSchema));
		if (!form.valid) return fail(400, { form });

		const { categoryName, ...rest } = form.data;

		await actions.category.update({
			data: { name: categoryName, ...rest },
			id: event.params.categoryId
		});

		return message(form, { type: 'success' });
	})
} satisfies Actions;
