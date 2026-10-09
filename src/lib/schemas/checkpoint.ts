import { MoneySchema } from '$lib/utils/money';
import * as v from 'valibot';

import { AccountIdSchema } from './account';

export const CheckpointIdSchema = v.object({ checkpointId: v.pipe(v.string(), v.minLength(1)) });

export const CheckpointSetSchema = v.object({
	...AccountIdSchema.entries,
	bankBalance: MoneySchema
});
