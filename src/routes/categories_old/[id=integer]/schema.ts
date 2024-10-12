import { z } from 'zod';

export const goalFormSchema = z.object({
	goalAmount: z.coerce.number().int().nonnegative()
});

export const retireFormSchema = z.object({
	retired: z.boolean()
});

export const moveTransactionsFormSchema = z.object({
	newCategoryId: z.coerce.number().int().positive()
});

export const removeFormSchema = z.object({
	newCategoryId: z.coerce.number().int().positive().optional()
});
