import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const schemaCategoryCreate = z.object({
	categoryName: nameSchema
});
