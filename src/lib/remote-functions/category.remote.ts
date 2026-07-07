import { BudgetIdSchema } from '$lib/schemas/budget';
import { CategoryCreateSchema, CategoryEditSchema, CategoryIdSchema } from '$lib/schemas/category';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import { guardedCommand, guardedForm, guardedQuery } from '$server/utils/remote-guard';

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
	async ({ budgetId, categoryName }, { ctx }) => {
		ctx.category.create(budgetId, categoryName);
	}
);

export const editCategory = guardedForm(
	CategoryEditSchema,
	async ({ categoryId, categoryName, notes, targetBalance }, { ctx }) => {
		ctx.category.edit(categoryId, { name: categoryName, notes, targetBalance });
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
