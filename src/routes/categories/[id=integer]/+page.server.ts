import { protectRoute } from '$lib/server/auth';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getCategoryDetails, updateCategory } from '$lib/server/categories';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

export const load: PageServerLoad = protectRoute(async ({ params, parent }) => {
	const { categories } = await parent();

	const category = categories.find((cat) => cat.id === Number(params.id));
	if (!category) error(404, 'Category not found.');

	return {
		category,
		otherCategories: categories.filter((cat) => cat.id !== category.id),
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
				goal: zfd.numeric(z.number().int().positive().optional())
			})
			.safeParse(formData);

		if (!parsed.success) {
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

	moveTransactions: protectRoute(() => {
		return fail(500, { error: 'Not implemented' });
	}),

	removeCategory: protectRoute(() => {
		return fail(500, { error: 'Not implemented' });
	})
} satisfies Actions;
