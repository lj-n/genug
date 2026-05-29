import z from 'zod';

export const schemaMonthlyAssigment = z.object({
	amount: z.int(),
	categoryId: z.string()
});
