import { protectRoute } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	getCategory,
	getCategoryDetails,
	getCategoryLastMonthStats,
	updateCategory
} from '$lib/server/categories';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getTeamRole } from '$lib/server/teams';

export const load: PageServerLoad = protectRoute(async ({ params, parent }) => {
	const { categories } = await parent();

	const category = categories.find((cat) => cat.id === Number(params.id));
	if (!category) error(404, 'Category not found.');

	return {
		category,
		otherCategories: categories.filter((cat) => cat.id !== category.id),
		stats: getCategoryLastMonthStats(db, category.id),
		...getCategoryDetails(db, category.id)
	};
});

export const actions = {
	updateCategory: protectRoute(async ({ params, request }, user) => {
		const formData = await request.formData();

		const parsed = zfd
			.formData({
				name: zfd.text(z.string().optional()),
				description: zfd.text(z.string().optional()),
				goal: zfd.numeric(z.number().int().nonnegative().optional())
			})
			.safeParse(formData);

		if (!parsed.success) {
			console.log(parsed.error);
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		try {
			updateCategory(db, user.id, Number(params.id), parsed.data);
		} catch (_e) {
			return fail(500, {
				updateCategoryError: 'Something went wrong, please try again.'
			});
		}
	}),

	retireCategory: protectRoute(async ({ params, request }, user) => {
		const formData = await request.formData();
		const retired = formData.get('retired')?.toString();

		if (typeof retired === 'undefined') {
			return fail(400);
		}

		try {
			updateCategory(db, user.id, Number(params.id), {
				retired: retired === 'true'
			});
		} catch (_e) {
			return fail(500, {
				updateCategoryError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();

		const category = getCategory(db, user.id, Number(params.id));

		if (!category) {
			return fail(401, { moveTransactionError: 'Category not found' });
		}

		const requestSchema = zfd.formData({
			newCategoryId: zfd.numeric(z.number().int().positive()),
			categoryName: zfd.text(z.literal(category.name))
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { moveTransactionError: 'Invalid Params' });
		}

		const newCategory = getCategory(db, user.id, parsed.data.newCategoryId);

		if (!newCategory) {
			return fail(401, { moveTransactionError: 'New category not found' });
		}

		if (
			(category.teamId !== null || newCategory.teamId !== null) &&
			category.teamId !== newCategory.teamId
		) {
			return fail(401, {
				moveTransactionError: 'New category must belong to the same team'
			});
		}

		if (newCategory.teamId) {
			const role = getTeamRole(db, newCategory.teamId, user.id);
			if (role !== 'OWNER') {
				return fail(401, {
					moveTransactionError: 'Must be team owner'
				});
			}
		}

		try {
			db.update(schema.transaction)
				.set({ categoryId: newCategory.id })
				.where(eq(schema.transaction.categoryId, category.id))
				.run();
		} catch (error) {
			return fail(500, { moveTransactionError: 'Something went wrong' });
		}
	}),

	removeCategory: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();

		const category = getCategory(db, user.id, Number(params.id));

		if (!category) {
			return fail(401, { removeCategoryError: 'Category not found' });
		}

		const requestSchema = zfd.formData({
			categoryName: zfd.text(z.literal(category.name))
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { removeCategoryError: 'Invalid Params' });
		}

		if (category.teamId) {
			const role = getTeamRole(db, category.teamId, user.id);
			if (role !== 'OWNER') {
				return fail(401, {
					removeCategoryError: 'Must be team owner'
				});
			}
		}

		try {
			db.transaction(() => {
				db.delete(schema.transaction)
					.where(eq(schema.transaction.categoryId, category.id))
					.run();

				db.delete(schema.category)
					.where(eq(schema.category.id, category.id))
					.run();
			});
		} catch (error) {
			return fail(500, { removeCategoryError: 'Not implemented' });
		}

		redirect(302, '/categories');
	})
} satisfies Actions;
