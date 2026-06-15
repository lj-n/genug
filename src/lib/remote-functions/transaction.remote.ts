import type {
	TransactionFilterParam,
	TransactionSortParam
} from '$lib/server/db/user-context/transaction.utils';

import { requested } from '$app/server';
import {
	BatchTransactionIdsSchema,
	BatchValidateSchema,
	ListTransactionsSchema,
	TransactionCreateSchema,
	TransactionEditSchema
} from '$lib/schemas/transaction';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';

export const listTransactions = guardedQuery(
	ListTransactionsSchema,
	async (
		{
			accountId,
			categoryId,
			notes,
			page,
			pageSize,
			sortAccount,
			sortCategory,
			sortDate,
			sortValidated
		},
		{ ctx }
	) => {
		const filter: TransactionFilterParam = {
			accountId,
			...(categoryId?.length ? { categoryId } : {}),
			...(notes ? { notes } : {})
		};

		const sort: TransactionSortParam = {
			...(sortCategory ? { category: sortCategory } : {}),
			...(sortAccount ? { account: sortAccount } : {}),
			...(sortDate ? { date: sortDate } : {}),
			...(sortValidated ? { validated: sortValidated } : {})
		};

		const transactions = ctx.transaction.list(filter, sort, { page: page - 1, pageSize });
		const allTransactions = ctx.transaction.list(filter, sort);

		return {
			pagination: { page, pageSize, totalTransactionCount: allTransactions.length },
			transactions
		};
	}
);

export const createTransaction = guardedForm(
	TransactionCreateSchema,
	async (data, { ctx, user }) => {
		ctx.transaction.create({
			accountId: data.accountId,
			amount: data.amount,
			budgetId: data.budgetId,
			categoryId: data.categoryId || null,
			createdBy: user.id,
			date: data.date,
			notes: data.notes || null,
			validated: data.validated
		});
	}
);

export const editTransaction = guardedForm(
	TransactionEditSchema,
	async ({ categoryId, notes, transactionId, ...rest }, { ctx }) => {
		const update = {
			...rest,
			categoryId: categoryId === '' ? null : categoryId,
			notes: notes === undefined ? undefined : notes || null,
			validated: rest.validated ?? false
		};
		ctx.transaction.edit(transactionId, update);
		void requested(listTransactions, Infinity).refreshAll();
	}
);

export const batchDeleteTransactions = guardedForm(
	BatchTransactionIdsSchema,
	async ({ ids }, { ctx }) => {
		ctx.transaction.delete(ids);
		void requested(listTransactions, Infinity).refreshAll();
	}
);

export const batchValidateTransactions = guardedForm(
	BatchValidateSchema,
	async ({ ids, validated }, { ctx }) => {
		ctx.transaction.validate(ids, validated);
		void requested(listTransactions, Infinity).refreshAll();
	}
);
