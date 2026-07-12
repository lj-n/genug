import { requested } from '$app/server';
import { BudgetIdSchema } from '$lib/schemas/budget';
import { CategoryCreateSchema, CategoryEditSchema, CategoryIdSchema } from '$lib/schemas/category';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import {
	guardedBatchQuery,
	guardedCommand,
	guardedForm,
	guardedQuery
} from '$server/utils/remote-guard';
import { invalid, isHttpError } from '@sveltejs/kit';

import { getMonthly } from './budget.remote';
import { REFRESH_LIMIT } from './remote.utils';

export const getCategories = guardedQuery(BudgetIdSchema, async ({ budgetId }, { ctx }) =>
	ctx.category.all(budgetId)
);

export const getArchivedCategories = guardedQuery(BudgetIdSchema, async ({ budgetId }, { ctx }) =>
	ctx.category.archived(budgetId)
);

export const getCategoryById = guardedBatchQuery(CategoryIdSchema, async (args, { ctx }) => {
	const results = await Promise.all(args.map(({ categoryId }) => ctx.category.byId(categoryId)));
	return (_arg, idx) => results[idx];
});

export const getCategoryStats = guardedBatchQuery(CategoryIdSchema, async (args, { ctx }) => {
	const results = await Promise.all(args.map(({ categoryId }) => ctx.category.stats(categoryId)));
	return (_arg, idx) => results[idx];
});

export const getCategoryArchivability = guardedBatchQuery(
	CategoryIdSchema,
	async (args, { ctx }) => {
		const results = await Promise.all(
			args.map(({ categoryId }) => ctx.category.archivability(categoryId))
		);
		return (_arg, idx) => results[idx];
	}
);

export const getCategoryDeletability = guardedBatchQuery(
	CategoryIdSchema,
	async (args, { ctx }) => {
		const results = await Promise.all(
			args.map(({ categoryId }) => ctx.category.deletability(categoryId))
		);
		return (_arg, idx) => results[idx];
	}
);

export const createCategory = guardedForm(
	CategoryCreateSchema,
	async ({ budgetId, categoryName }, { ctx, invalid: issue }) => {
		try {
			ctx.category.create(budgetId, categoryName);
		} catch (error) {
			if (isHttpError(error, 400)) invalid(issue.categoryName(error.body.message));
			throw error;
		}
		await Promise.all([
			requested(getCategories, REFRESH_LIMIT).refreshAll(),
			requested(getMonthly, REFRESH_LIMIT).refreshAll()
		]);
	}
);

export const editCategory = guardedForm(
	CategoryEditSchema,
	async ({ categoryId, categoryName, notes, targetBalance }, { ctx, invalid: issue }) => {
		try {
			ctx.category.edit(categoryId, { name: categoryName, notes, targetBalance });
		} catch (error) {
			if (isHttpError(error, 400)) invalid(issue.categoryName(error.body.message));
			throw error;
		}
	}
);

export const archiveCategory = guardedForm(CategoryIdSchema, async ({ categoryId }, { ctx }) => {
	ctx.category.archive(categoryId);
});

export const restoreCategory = guardedForm(CategoryIdSchema, async ({ categoryId }, { ctx }) => {
	ctx.category.restore(categoryId);
});

export const deleteCategory = guardedForm(CategoryIdSchema, async ({ categoryId }, { ctx }) => {
	ctx.category.delete(categoryId);
	await Promise.all([
		requested(getCategories, REFRESH_LIMIT).refreshAll(),
		requested(getMonthly, REFRESH_LIMIT).refreshAll()
	]);
});

export const reorderCategories = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.category.reorder(orderedIds);
});
