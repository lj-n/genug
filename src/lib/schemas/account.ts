import * as v from 'valibot';

import { BudgetIdSchema } from './budget';

export const AccountCreateSchema = v.object({
	...BudgetIdSchema.entries,
	accountName: v.pipe(v.string(), v.minLength(1)),
	startingBalance: v.optional(v.number(), 0)
});
