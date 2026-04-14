import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const schema = z.object({
	budgetName: nameSchema
});
