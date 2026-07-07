import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import * as v from 'valibot';

export const colsClass = 'grid-cols-[1fr_1fr_0.5fr_0.5fr_3.5rem]';

export const getTransactionURLParams = ({ searchParams }: URL) =>
	v.parse(TransactionsURLParamsSchema, {
		categoryId: searchParams.getAll('categoryId'),
		notes: searchParams.get('notes'),
		page: searchParams.get('page'),
		pageSize: searchParams.get('pageSize'),
		sortAccount: searchParams.get('sortAccount'),
		sortAmount: searchParams.get('sortAmount'),
		sortCategory: searchParams.get('sortCategory'),
		sortDate: searchParams.get('sortDate'),
		sortValidated: searchParams.get('sortValidated')
	});

export type TransactionURLParams = v.InferOutput<typeof TransactionsURLParamsSchema>;
