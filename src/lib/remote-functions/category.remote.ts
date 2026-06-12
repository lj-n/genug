import { form, query } from '$app/server';
import { actions } from '$db';
import { BudgetIdSchema } from '$lib/schemas/budget';
import { CategoryCreateSchema, CategoryEditSchema, CategoryIdSchema } from '$lib/schemas/category';
import { error } from '@sveltejs/kit';

import { requireUser } from './remote.utils';

export const getCategories = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.category.getAllCategories({ budgetId, userId: user.id });
});

export const getArchivedCategories = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.category.getArchivedCategories({ budgetId, userId: user.id });
});

export const getCategoryById = query(CategoryIdSchema, async ({ categoryId }) => {
	const [user] = requireUser();
	const category = actions.category.getCategoryById({ id: categoryId, userId: user.id });
	if (!category) error(404);
	return category;
});

export const createCategory = form(CategoryCreateSchema, async ({ budgetId, categoryName }) => {
	const [user] = requireUser();
	actions.category.createCategory({ budgetId, name: categoryName, userId: user.id });
});

export const editCategory = form(
	CategoryEditSchema,
	async ({ categoryId, categoryName, notes, targetBalance }) => {
		requireUser();
		actions.category.updateCategory({
			data: {
				name: categoryName,
				notes: notes === undefined ? undefined : notes || null,
				targetBalance: targetBalance === undefined ? undefined : targetBalance || null
			},
			id: categoryId
		});
	}
);

export const archiveCategory = form(CategoryIdSchema, async ({ categoryId }) => {
	const [user] = requireUser();
	const category = actions.category.getCategoryById({ id: categoryId, userId: user.id });
	if (!category) throw new Error('Category not found');
	actions.category.updateCategory({ data: { archivedAt: new Date() }, id: categoryId });
});

export const restoreCategory = form(CategoryIdSchema, async ({ categoryId }) => {
	const [user] = requireUser();
	const category = actions.category.getCategoryById({ id: categoryId, userId: user.id });
	if (!category) throw new Error('Category not found');
	actions.category.updateCategory({ data: { archivedAt: null }, id: categoryId });
});

export const getCategoriesFlat = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.category
		.getAllCategoriesFlat({ budgetId, userId: user.id })
		.filter((c) => c.archivedAt === null)
		.map((c) => ({ id: c.id, name: c.name }));
});
