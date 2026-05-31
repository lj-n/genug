import { CURRENCIES } from '$lib/utils/currencies';
import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

export const schemaInviteUser = z.object({
	invite: z.string()
});

export const schemaEditBudget = z.object({
	currency: z.enum(CURRENCIES),
	name: nameSchema
});
