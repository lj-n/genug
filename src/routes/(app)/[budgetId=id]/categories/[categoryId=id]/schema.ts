import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const editSchema = z.object({
	categoryName: nameSchema,
	notes: z.string().nullable(),
	targetBalance: z.int().positive().nullable()
});
