import { withAuth } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

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
	console.log('🛸 < file: +page.server.ts:18 < category =', category);

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
	}),

	retireCategory: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const retired = formData.get('retired')?.toString();

		if (typeof retired === 'undefined') {
			return fail(400);
		}

		try {
			user.category.update(Number(params.id), {
				retired: retired === 'true'
			});
		} catch (_e) {
			return fail(500, {
				updateCategoryError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const categoryName = formData.get('categoryName')?.toString();
		const newCategoryId = formData.get('newCategoryId')?.toString();

		const category = user.category.get(Number(params.id));

		if (!category || category.name !== categoryName) {
			return fail(400, {
				newCategoryId,
				categoryName,
				moveTransactionError: 'Wrong category name.'
			});
		}

		try {
			db.update(schema.userTransaction)
				.set({
					categoryId: Number(newCategoryId)
				})
				.where(
					and(
						eq(schema.userTransaction.userId, user.id),
						eq(schema.userTransaction.categoryId, category.id)
					)
				)
				.returning()
				.all();
		} catch (error) {
			fail(500, { moveTransactionError: 'Something went wrong, sorry.' });
		}
	}),

  removeCategory: withAuth(async({ params, request}, user ) => {
    const formData = await request.formData();
		const categoryName = formData.get('categoryName')?.toString();

		const category = user.category.get(Number(params.id));

		if (!category || category.name !== categoryName) {
			return fail(400, {
				categoryName,
				removeCategoryError: 'Wrong category name.'
			});
		}

		try {
			db.transaction(() => {
				db.delete(schema.userTransaction)
					.where(
						and(
							eq(schema.userTransaction.userId, user.id),
							eq(schema.userTransaction.categoryId, category.id)
						)
					)
					.returning()
					.all();

				db.delete(schema.userCategory)
					.where(eq(schema.userCategory.id, category.id))
					.returning()
					.get();
			});
		} catch (error) {
			fail(500, { removeCategoryError: 'Something went wrong, sorry.' });
		}

		throw redirect(302, '/category');

  })
} satisfies Actions;
