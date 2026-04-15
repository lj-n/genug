import z from 'zod';

export const assignmentSchema = z.object({
	amount: z.int(),
	categoryId: z.string()
});
