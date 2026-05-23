import z from 'zod';

export const schemaTransactionEdit = z
	.object({
		accountId: z.string(),
		amount: z.int(),
		categoryId: z.string().nullable(),
		date: z.iso.date(),
		notes: z.string().nullable(),
		transactionId: z.string(),
		validated: z.boolean()
	})
	.partial()
	.required({ transactionId: true });

export const schemaTransactionCreate = z.object({
	accountId: z.string(),
	amount: z.int(),
	categoryId: z.string().nullable(),
	date: z.string(),
	notes: z.string().nullable(),
	validated: z.boolean()
});
