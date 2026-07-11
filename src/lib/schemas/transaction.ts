import { MoneySchema } from '$lib/utils/money';
import * as v from 'valibot';

import { CoercedNumber } from './utils';

export const TransactionCreateSchema = v.object({
	accountId: v.pipe(v.string(), v.minLength(1)),
	amount: MoneySchema,
	budgetId: v.pipe(v.string(), v.minLength(1)),
	categoryId: v.optional(v.string()),
	date: v.optional(v.pipe(v.string(), v.minLength(1))),
	notes: v.optional(v.string()),
	validated: v.optional(v.boolean(), false)
});

export const TransactionEditSchema = v.object({
	accountId: v.optional(v.string()),
	amount: v.optional(MoneySchema),
	categoryId: v.optional(v.string()),
	date: v.optional(v.string()),
	notes: v.optional(v.string()),
	transactionId: v.pipe(v.string(), v.minLength(1)),
	validated: v.optional(v.boolean(), false)
});

export const BatchTransactionIdsSchema = v.object({
	ids: v.array(v.pipe(v.string(), v.minLength(1)))
});

export const BatchValidateSchema = v.object({
	...BatchTransactionIdsSchema.entries,
	validated: v.boolean()
});

const SortParam = v.nullish(v.picklist(['asc', 'desc']));

export const TransactionsURLParamsSchema = v.object({
	categoryId: v.nullish(v.array(v.string()), []),
	notes: v.nullish(v.string()),
	page: v.nullish(v.pipe(CoercedNumber, v.integer()), 1),
	pageSize: v.nullish(v.pipe(CoercedNumber, v.integer()), 15),
	sortAccount: SortParam,
	sortAmount: SortParam,
	sortCategory: SortParam,
	sortDate: SortParam,
	sortValidated: SortParam
});

export type TransactionsURLParams = v.InferOutput<typeof TransactionsURLParamsSchema>;

export const ListTransactionsSchema = v.object({
	accountId: v.pipe(v.string(), v.minLength(1)),
	...TransactionsURLParamsSchema.entries
});
