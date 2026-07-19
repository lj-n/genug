import { ApiTransferEditSchema } from '$lib/schemas/api';
import { editTransfer } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok } from '$server/api/respond';
import * as v from 'valibot';

export const PATCH = withApi(async ({ ctx, event }) => {
	const body = v.parse(ApiTransferEditSchema, await event.request.json());
	return ok(editTransfer(ctx, event.params.transferId!, body));
});
