import { CURRENCIES } from '$lib/utils/currencies';
import * as v from 'valibot';

export const BudgetIdSchema = v.object({ budgetId: v.pipe(v.string(), v.minLength(1)) });

export const BudgetSchema = v.object({
	currency: v.picklist(CURRENCIES),
	name: v.pipe(v.string(), v.minLength(1))
});

export const SetBudgetSchema = v.object({
	...BudgetIdSchema.entries,
	...BudgetSchema.entries
});

export const BudgetAndUserIdSchema = v.object({
	budgetId: v.pipe(v.string(), v.minLength(1)),
	userId: v.pipe(v.string(), v.minLength(1))
});

export const FindBudgetUserSchema = v.object({
	budgetId: v.pipe(v.string(), v.minLength(1)),
	inviteeName: v.pipe(v.string(), v.minLength(1))
});
