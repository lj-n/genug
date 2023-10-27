import { withAuth } from '$lib/server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth((_, user) => {
	return { categories: user.category.getAll() };
});

export const actions = {
	createUserCategory: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const categoryName = formData.get('categoryName')?.toString();
		const description = formData.get('description')?.toString();

		if (!categoryName) {
			return fail(400, { description, error: 'Missing category name' });
		}

		try {
			const category = user.category.create({
				name: categoryName,
				description
			});
      
			return { success: true, category };
		} catch (_e) {
			return fail(500, {
				categoryName,
				description,
				error: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
