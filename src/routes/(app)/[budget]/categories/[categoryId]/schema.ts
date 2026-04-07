import { m } from '$lib/paraglide/messages';
import z from 'zod';

export const editSchema = z.object({
	categoryName: z
		.string()
		.min(3, { error: m.name_error_minlength({ length: 3 }) })
		.max(50, { error: m.name_error_maxlength({ length: 50 }) }),
	notes: z.string().nullable(),
	targetBalance: z.int().positive().nullable()
});
