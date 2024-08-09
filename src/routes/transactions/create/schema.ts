import { z } from 'zod';

export const createTransactionSchema = z.object({
	accountId: z.coerce.number().int().positive({
		message: 'The transaction must be associated with an account.'
	}),
	categoryId: z.coerce.number().int().positive().nullable(),
	date: z.coerce
		.string()
		.date()
		.transform((dt) => new Date(dt).toISOString().slice(0, 10))
		.default(new Date().toISOString().slice(0, 10)),
	description: z.string().max(255).optional(),
	flow: z.coerce
		.number({
			message: 'Enter only fractional monetary units. (e.g. 100 for $1.00)'
		})
		.int(),
	validated: z.coerce.boolean().optional()
});
