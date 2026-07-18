import * as v from 'valibot';

import { NameSchema } from './utils';

export const ApiTokenCreateSchema = v.object({
	expiresAt: v.optional(v.pipe(v.string(), v.isoDate())),
	name: NameSchema
});

export const ApiTokenIdSchema = v.object({ tokenId: v.pipe(v.string(), v.minLength(1)) });
