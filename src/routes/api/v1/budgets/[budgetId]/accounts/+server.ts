import { listAccounts } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok } from '$server/api/respond';

export const GET = withApi(async ({ ctx, event }) => ok(listAccounts(ctx, event.params.budgetId!)));
