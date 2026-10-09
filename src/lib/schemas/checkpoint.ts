import { MoneySchema } from '$lib/utils/money';
import * as v from 'valibot';

import { AccountIdSchema } from './account';

export const CheckpointSetSchema = v.object({
	...AccountIdSchema.entries,
	bankBalance: MoneySchema
});
