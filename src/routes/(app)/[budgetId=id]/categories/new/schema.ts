import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const createCategorySchema = z.object({
	categoryName: nameSchema
});
