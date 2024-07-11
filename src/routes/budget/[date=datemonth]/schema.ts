import { z } from 'zod';

export const formSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  budget: z.coerce.number().int()
});

export type FormSchema = typeof formSchema;