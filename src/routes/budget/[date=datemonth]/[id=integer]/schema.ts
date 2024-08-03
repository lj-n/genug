import { z } from 'zod';

export const setBudgetFormSchema = z.object({
	categoryId: z.coerce.number().int().positive(),
	budget: z.coerce
		.number({
			message: 'Enter only fractional monetary units. (e.g. 100 for $1.00)'
		})
		.int()
});
