import { z } from 'zod';

export const createAccountFormSchema = z.object({
	accountName: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.max(255, 'Name must be at most 255 characters long'),
	accountDescription: z
		.string()
		.max(255, 'Description must be at most 255 characters long')
		.optional(),
	teamId: z.number().int().positive().optional()
});
