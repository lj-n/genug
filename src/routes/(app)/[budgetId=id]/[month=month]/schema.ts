import z from 'zod';

export const schemaMonthlyAssigment = z.object({
	amount: z.int(),
	categoryId: z.string()
});

export const schemaTransferAssignment = z.object({
	amount: z.int().positive(),
	fromCategoryId: z.preprocess((v) => v || undefined, z.string().optional()),
	toCategoryId: z.string()
});
