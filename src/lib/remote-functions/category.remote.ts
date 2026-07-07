import { requested } from '$app/server';
import { BudgetIdSchema } from '$lib/schemas/budget';
import { CategoryCreateSchema, CategoryEditSchema, CategoryIdSchema } from '$lib/schemas/category';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import { guardedCommand, guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { invalid, isHttpError } from '@sveltejs/kit';

import { getMonthly } from './budget.remote';

export const getCategories = guardedQuery(BudgetIdSchema, async ({ budgetId }, { ctx }) =>
	ctx.category.all(budgetId)
);

export const getArchivedCategories = guardedQuery(BudgetIdSchema, async ({ budgetId }, { ctx }) =>
	ctx.category.archived(budgetId)
);

export const getCategoryById = guardedQuery(CategoryIdSchema, async ({ categoryId }, { ctx }) =>
	ctx.category.byId(categoryId)
);

export const getCategoryStats = guardedQuery(CategoryIdSchema, async ({ categoryId }, { ctx }) =>
	ctx.category.stats(categoryId)
);

export const getCategoryArchivability = guardedQuery(
	CategoryIdSchema,
	async ({ categoryId }, { ctx }) => ctx.category.archivability(categoryId)
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
			requested(getCategories, 1).refreshAll(),
			requested(getMonthly, 1).refreshAll()
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

export const reorderCategories = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.category.reorder(orderedIds);
});
