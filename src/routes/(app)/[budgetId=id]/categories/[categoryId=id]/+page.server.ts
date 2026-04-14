import { withPermissions } from '$db/actions';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { isArchivable } from './category-utils';
import { editSchema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, actions, event: PageServerLoadEvent) => {
		const categories = actions.category.all();

		const category = categories.find((c) => c.id === event.params.categoryId);

		if (!category) error(404, 'Category not found');

		return { category };
	}
);

export const actions = {
	archive: withPermissions(async (_user, actions, event) => {
		const category = actions.category.getById({ id: event.params.categoryId });
		if (!category || !isArchivable(category)) error(404, 'Category not found');

		actions.category.update({
			data: { archivedAt: new Date() },
			id: event.params.categoryId
		});

		return { success: true };
	}),

	edit: withPermissions(async (_user, actions, event) => {
		const category = actions.category.getById({ id: event.params.categoryId });
		if (!category) error(404, 'Category not found');

		const form = await superValidate(event.request, zod4(editSchema));
		if (!form.valid) return fail(400, { form });

		const { categoryName, ...rest } = form.data;

		actions.category.update({
			data: { name: categoryName, ...rest },
			id: event.params.categoryId
		});

		return message(form, { type: 'success' });
	}),

	restore: withPermissions(async (_user, actions, event) => {
		const category = actions.category.getById({ id: event.params.categoryId });
		if (!category || category.archivedAt === null) error(404, 'Category not found');

		actions.category.update({
			data: { archivedAt: null },
			id: event.params.categoryId
		});

		return { success: true };
	})
} satisfies Actions;
