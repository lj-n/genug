import { z } from 'zod';

export const createCategoryFormSchema = z.object({
	name: z.string().min(2),
	description: z.string().optional(),
	teamId: z.number().int().positive().optional()
});
