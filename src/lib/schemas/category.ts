import { MoneySchema } from '$lib/utils/money';
import * as v from 'valibot';

import { BudgetIdSchema } from './budget';

export const CategoryIdSchema = v.object({ categoryId: v.pipe(v.string(), v.minLength(1)) });

export const CategoryCreateSchema = v.object({
	...BudgetIdSchema.entries,
	categoryName: v.pipe(v.string(), v.minLength(1))
});

export const CategoryEditSchema = v.object({
	...CategoryIdSchema.entries,
	categoryName: v.pipe(v.string(), v.minLength(1)),
	notes: v.optional(v.string()),
	targetBalance: v.optional(MoneySchema)
});
