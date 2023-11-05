import { withAuth } from '$lib/server/auth';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/**
 * Data needed:
 *  - Category
 *
 *  - Related Transaction Count
 *  - Related Transaction Sum
 *  - Related Budget Amount Sum
 *
 *  - All Transactions in last n months
 */

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const category = user.category.getDetailed(Number(params.id));

	if (!category) {
		throw error(404, 'Category not found.');
	}

	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ title: 'Categories', href: '/category' },
		{ title: category.name }
	];

	const allCategories = user.category.getAll();
	const otherCategories = allCategories.filter(
		({ id }) => id !== Number(params.id)
	);

	return {
		breadcrumbs,
		category,
		otherCategories
	};
});

export const actions = {
	updateCategory: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		let name = formData.get('name')?.toString();
		let description = formData.get('description')?.toString();
		const goal = formData.get('goal')?.toString();
    
		if (!name && !description && !goal) {
      return fail(400);
		}
    
    console.log("🛸 < file: +page.server.ts:47 < goal =", goal);
    
		try {
			/** Prevent empty strings from being submitted */
			name ||= undefined;
			description ||= undefined;
      
			user.category.update(Number(params.id), {
				name,
				description,
				goal: Number(goal) || null
			});
		} catch (_e) {
			return fail(500, {
				updateCategoryError: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
