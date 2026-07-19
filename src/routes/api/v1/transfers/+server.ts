import { ApiTransferCreateSchema } from '$lib/schemas/api';
import { createTransfer } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { created } from '$server/api/respond';
import * as v from 'valibot';

export const POST = withApi(async ({ ctx, event }) => {
	const body = v.parse(ApiTransferCreateSchema, await event.request.json());
	return created(createTransfer(ctx, body));
});
