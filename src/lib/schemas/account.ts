import * as v from 'valibot';

import { BudgetIdSchema } from './budget';
import { NameSchema } from './utils';

export const AccountIdSchema = v.object({ accountId: v.pipe(v.string(), v.minLength(1)) });

export const AccountCreateSchema = v.object({
	...BudgetIdSchema.entries,
	accountName: NameSchema,
	startingBalance: v.optional(v.number(), 0)
});

export const AccountSetNameSchema = v.object({
	...AccountIdSchema.entries,
	accountName: NameSchema
});
