import { TransactionEditSchema } from '$lib/schemas/transaction';
import { deleteTransaction, editTransaction } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { ok, parseMonthOrThrow } from '$server/api/respond';
import * as v from 'valibot';

// The transaction id travels in the path, not the body (matches the derived
// `TransactionEdit` request schema in the OpenAPI contract).
const EditBodySchema = v.omit(TransactionEditSchema, ['transactionId']);

export const PATCH = withApi(async ({ ctx, event }) => {
	const month = parseMonthOrThrow(event.url.searchParams.get('month'));
	const body = v.parse(EditBodySchema, await event.request.json());
	return ok(editTransaction(ctx, event.params.transactionId!, body, month));
});

export const DELETE = withApi(async ({ ctx, event }) => {
	const month = parseMonthOrThrow(event.url.searchParams.get('month'));
	return ok(deleteTransaction(ctx, event.params.transactionId!, month));
});
