import { CURRENCIES } from '$lib/utils/currencies';
import { MoneySchema } from '$lib/utils/money';
import { MonthSchema } from '$lib/utils/month';
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
	month: MonthSchema
});

export const AssignmentSchema = v.object({
	...BudgetMonthSchema.entries,
	amount: MoneySchema,
	categoryId: v.pipe(v.string(), v.minLength(1))
});

export const ReassignmentSchema = v.object({
	...BudgetMonthSchema.entries,
	amount: v.pipe(
		MoneySchema,
		v.check((value) => value !== 0, 'Amount must not be zero')
	),
	sourceCategoryId: v.string(),
	targetCategoryId: v.string()
});
