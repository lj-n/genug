import { protectRoute } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import {
	getUserCategories,
	getUserCategory,
	getUserCategoryBudgetSum,
	getUserCategoryLastMonthStats,
	getUserCategoryTransactionInfo,
	updateUserCategory
} from '$lib/server/category';

export const load: PageServerLoad = protectRoute(
	async ({ params }, { userId }) => {
		const categoryId = Number(params.id);
		const category = getUserCategory(db, userId, categoryId);

		if (!category) {
			error(404, 'Category not found.');
		}

		return {
			category,
			transactions: getUserCategoryTransactionInfo(db, userId, categoryId),
			budgetSum: getUserCategoryBudgetSum(db, userId, categoryId),
			lastMonthsStats: getUserCategoryLastMonthStats(
				db,
				userId,
				categoryId,
				12
			),
			otherCategories: getUserCategories(db, userId).filter(
				(cat) => cat.id !== categoryId
			)
		};
	}
);

export const actions = {
	updateCategory: protectRoute(async ({ params, request }, { userId }) => {
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

			updateUserCategory(db, userId, Number(params.id), {
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

	retireCategory: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const retired = formData.get('retired')?.toString();

		if (typeof retired === 'undefined') {
			return fail(400);
		}

		try {
			updateUserCategory(db, userId, Number(params.id), {
				retired: retired === 'true'
			});
		} catch (_e) {
			return fail(500, {
				updateCategoryError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const categoryName = formData.get('categoryName')?.toString();
		const newCategoryId = formData.get('newCategoryId')?.toString();

		const category = getUserCategory(db, userId, Number(params.id));

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
						eq(schema.userTransaction.userId, userId),
						eq(schema.userTransaction.categoryId, category.id)
					)
				)
				.returning()
				.all();
		} catch (error) {
			fail(500, { moveTransactionError: 'Something went wrong, sorry.' });
		}
	}),

	removeCategory: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const categoryName = formData.get('categoryName')?.toString();

		const category = getUserCategory(db, userId, Number(params.id));

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
							eq(schema.userTransaction.userId, userId),
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

		redirect(302, '/category');
	})
} satisfies Actions;
