import z from 'zod';

export const categoryEditSchema = z
	.object({
		name: z.string().min(3)
	})
	.partial();
