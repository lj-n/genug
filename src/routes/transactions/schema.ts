import { z } from 'zod';

export const validateFormSchema = z.object({
	transactionIds: z.coerce.number().int().positive().array(),
	invalidate: z.coerce.boolean().optional()
});
