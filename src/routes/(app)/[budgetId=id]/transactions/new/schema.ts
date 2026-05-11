import z from 'zod';

export const schemaTransactionCreate = z.object({
	accountId: z.string(),
	amount: z.int(),
	categoryId: z.string().nullable(),
	date: z.string(),
	notes: z.string().nullable(),
	validated: z.boolean()
});
