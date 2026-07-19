import { getEnvelopeView } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok, parseMonthOrThrow } from '$server/api/respond';

export const GET = withApi(async ({ ctx, event }) => {
	const month = parseMonthOrThrow(event.params.month ?? null);
	return ok(getEnvelopeView(ctx, event.params.budgetId!, month));
});
