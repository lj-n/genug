import { z } from 'zod';

export const setBudgetFormSchema = z.object({
	categoryId: z.coerce.number().int().positive(),
	budget: z.coerce.number().int()
});
