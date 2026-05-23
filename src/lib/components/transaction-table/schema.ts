import z from 'zod';

const sortParam = z.enum(['asc', 'desc']).optional().catch(undefined);

export const schemaURLParams = z.object({
	categoryId: z.string().array().optional().catch([]),
	notes: z.string().min(1).optional().catch(undefined),
	page: z.coerce.number().min(1).default(1).catch(1),
	pageSize: z.coerce.number().min(15).default(15).catch(15),
	sortAccount: sortParam,
	sortCategory: sortParam,
	sortDate: sortParam,
	sortValidated: sortParam
});
