import { ApiReassignmentSchema } from '$lib/schemas/api';
import { reassign } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok } from '$server/api/respond';
import * as v from 'valibot';

export const POST = withApi(async ({ ctx, event }) => {
	const body = v.parse(ApiReassignmentSchema, await event.request.json());
	return ok(reassign(ctx, body));
});
