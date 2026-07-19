import { AssignmentSchema } from '$lib/schemas/budget';
import { setAssignment } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok } from '$server/api/respond';
import * as v from 'valibot';

export const POST = withApi(async ({ ctx, event }) => {
	const body = v.parse(AssignmentSchema, await event.request.json());
	return ok(setAssignment(ctx, body));
});
