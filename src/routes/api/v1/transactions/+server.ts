import { ListTransactionsSchema, TransactionCreateSchema } from '$lib/schemas/transaction';
import { createTransaction, listTransactions } from '$server/api/endpoints';
import { withApi } from '$server/api/guard';
import { created, ok, parseMonthOrThrow } from '$server/api/respond';
import * as v from 'valibot';

export const GET = withApi(async ({ ctx, event }) => {
	const search = event.url.searchParams;
	const params = v.parse(ListTransactionsSchema, {
		accountId: search.get('accountId') ?? undefined,
		categoryId: search.getAll('categoryId'),
		notes: search.get('notes') ?? undefined,
		page: search.get('page') ?? undefined,
		pageSize: search.get('pageSize') ?? undefined,
		sortAccount: search.get('sortAccount') ?? undefined,
		sortAmount: search.get('sortAmount') ?? undefined,
		sortCategory: search.get('sortCategory') ?? undefined,
		sortDate: search.get('sortDate') ?? undefined,
		sortValidated: search.get('sortValidated') ?? undefined
	});

	return ok(listTransactions(ctx, params));
});

export const POST = withApi(async ({ ctx, event, user }) => {
	const month = parseMonthOrThrow(event.url.searchParams.get('month'));
	const body = v.parse(TransactionCreateSchema, await event.request.json());
	return created(createTransaction(ctx, user.id, body, month));
});
