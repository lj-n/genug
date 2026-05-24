import z from 'zod';

export const schemaUserCreate = z.object({
	username: z.string().min(1)
});
export const schemaUserDelete = z.object({
	userId: z.string().min(1)
});
