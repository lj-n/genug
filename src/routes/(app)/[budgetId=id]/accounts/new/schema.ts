import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const schemaAccountCreate = z.object({
	accountName: nameSchema,
	startingBalance: z.number().int().optional().default(0)
});
