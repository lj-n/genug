import z from 'zod';

export const schemaInviteUser = z.object({
	invite: z.string()
});
