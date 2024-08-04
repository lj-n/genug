import { protectRoute } from '$lib/server/auth';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	getCategories,
	getCategory,
	getCategoryDetails,
	getCategoryLastMonthStats,
	updateCategory
} from '$lib/server/categories';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getTeamRole } from '$lib/server/teams';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createCategoryFormSchema } from '../create/schema';
import {
	goalFormSchema,
	moveTransactionsFormSchema,
	retireFormSchema
} from './schema';
import { getBudget } from '$lib/server/budgets';

export const load: PageServerLoad = protectRoute(async ({ params }, user) => {
	const categories = getCategories(db, user.id, true);

	const category = categories.find((cat) => cat.id === Number(params.id));
	if (!category) error(404, 'Category not found.');

	return {
		category,
		otherCategories: categories.filter((cat) => cat.id !== category.id),
		chartData: getCategoryLastMonthStats(db, category.id),
		stats: getCategoryDetails(db, category.id),
		budget: getBudget(db, user.id, new Date().toISOString().slice(0, 10)).find(
			(b) => b.id === category.id
		)!,
		updateForm: await superValidate(
			{
				categoryName: category.name,
				categoryDescription: category.description ?? ''
			},
			zod(createCategoryFormSchema)
		),
		goalForm: await superValidate(
			{ goalAmount: category.goal ?? 0 },
			zod(goalFormSchema)
		),
		retireForm: await superValidate(zod(retireFormSchema)),
		moveTransactionsForm: await superValidate(zod(moveTransactionsFormSchema))
	};
});

export const actions = {
	update: protectRoute(async ({ params, request }, user) => {
		const form = await superValidate(request, zod(createCategoryFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { categoryName, categoryDescription } = form.data;

		try {
			const category = updateCategory(db, user.id, Number(params.id), {
				name: categoryName,
				description: categoryDescription
			});

			return message(form, {
				type: 'success',
				text: `Category "${category.name}" updated successfully.`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}
	}),

	goal: protectRoute(async ({ params, request }, user) => {
		const form = await superValidate(request, zod(goalFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { goalAmount } = form.data;

		try {
			const category = updateCategory(db, user.id, Number(params.id), {
				goal: goalAmount
			});

			return message(form, {
				type: 'success',
				text: `Goal for category "${category.name}" updated successfully.`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}
	}),

	retire: protectRoute(async ({ params, request, cookies }, user) => {
		const form = await superValidate(request, zod(retireFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { retired } = form.data;

		try {
			const category = updateCategory(db, user.id, Number(params.id), {
				retired
			});
			return message(form, {
				type: 'success',
				text: retired
					? `Category "${category.name}" archived.`
					: `Category "${category.name}" activated.`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}
	}),

	moveTransactions: protectRoute(async ({ request, params }, user) => {
		const form = await superValidate(request, zod(moveTransactionsFormSchema));

		const category = getCategory(db, user.id, Number(params.id));

		if (!category) {
			return fail(401, { moveTransactionError: 'Category not found' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const { newCategoryId } = form.data;

		const newCategory = getCategory(db, user.id, newCategoryId);

		if (!newCategory) {
			return message(form, { type: 'error', text: 'New category not found' });
		}

		if (
			(category.teamId !== null || newCategory.teamId !== null) &&
			category.teamId !== newCategory.teamId
		) {
			return message(form, {
				type: 'error',
				text: 'New category must belong to the same team'
			});
		}

		if (newCategory.teamId) {
			const role = getTeamRole(db, newCategory.teamId, user.id);
			if (role !== 'OWNER') {
				return message(form, {
					type: 'error',
					text: 'Must be team owner'
				});
			}
		}

		try {
			const transactions = db
				.update(schema.transaction)
				.set({ categoryId: newCategory.id })
				.where(eq(schema.transaction.categoryId, category.id))
				.returning()
				.all();

			return message(form, {
				type: 'success',
				text: `Moved ${transactions.length} transactions to "${newCategory.name}"`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}
	})
} satisfies Actions;
