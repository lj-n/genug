import { CURRENCIES } from '$lib/utils/currencies';
import * as v from 'valibot';

export const BudgetIdSchema = v.object({ budgetId: v.pipe(v.string(), v.minLength(1)) });

export const CreateBudgetSchema = v.object({
	currency: v.picklist(CURRENCIES),
	name: v.pipe(v.string(), v.minLength(1))
});

export const EditBudgetSchema = v.object({
	...BudgetIdSchema.entries,
	...CreateBudgetSchema.entries
});

export const BudgetAndUserIdSchema = v.object({
	budgetId: v.pipe(v.string(), v.minLength(1)),
	userId: v.pipe(v.string(), v.minLength(1))
});

export const FindBudgetUserSchema = v.object({
	budgetId: v.pipe(v.string(), v.minLength(1)),
	inviteeName: v.pipe(v.string(), v.minLength(1))
});

export const BudgetMonthSchema = v.object({
	...BudgetIdSchema.entries,
	month: v.pipe(v.number(), v.integer())
});

export const AssignmentSchema = v.object({
	...BudgetMonthSchema.entries,
	amount: v.number(),
	categoryId: v.pipe(v.string(), v.minLength(1))
});

export const TransferAssignmentSchema = v.object({
	...BudgetMonthSchema.entries,
	amount: v.number(),
	sourceCategoryId: v.string(),
	targetCategoryId: v.string()
});
