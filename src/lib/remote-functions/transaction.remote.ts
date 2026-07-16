import type {
	TransactionFilterParam,
	TransactionSortParam
} from '$lib/server/db/user-context/transaction';

import { requested } from '$app/server';
import {
	BatchTransactionIdsSchema,
	BatchValidateSchema,
	ListTransactionsSchema,
	TransactionCreateSchema,
	TransactionEditSchema,
	TransferCreateSchema,
	TransferEditSchema
} from '$lib/schemas/transaction';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';

import { REFRESH_LIMIT } from './remote.utils';

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
			sortAmount,
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
			...(sortAmount ? { amount: sortAmount } : {}),
			...(sortValidated ? { validated: sortValidated } : {})
		};

		const { rows, total } = ctx.transaction.page(filter, sort, { page: page - 1, pageSize });

		return {
			pagination: { page, pageSize, totalTransactionCount: total },
			transactions: rows
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
		await requested(listTransactions, REFRESH_LIMIT).refreshAll();
	}
);

export const editTransaction = guardedForm(
	TransactionEditSchema,
	async ({ categoryId, notes, transactionId, ...rest }, { ctx }) => {
		const update = {
			...rest,
			categoryId: categoryId === '' ? null : categoryId,
			notes: notes === undefined ? undefined : notes || null,
			validated: rest.validated
		};
		ctx.transaction.edit(transactionId, update);
		await requested(listTransactions, REFRESH_LIMIT).refreshAll();
	}
);

/** Register-relative sign → transfer direction: negative leaves the viewed account. */
function transferDirection(data: {
	accountId: string;
	amount: number;
	counterpartAccountId: string;
}) {
	return data.amount < 0
		? { fromAccountId: data.accountId, toAccountId: data.counterpartAccountId }
		: { fromAccountId: data.counterpartAccountId, toAccountId: data.accountId };
}

export const createTransfer = guardedForm(TransferCreateSchema, async (data, { ctx }) => {
	ctx.transaction.transfer({
		amount: Math.abs(data.amount),
		budgetId: data.budgetId,
		date: data.date,
		notes: data.notes || null,
		...transferDirection(data)
	});
	await requested(listTransactions, REFRESH_LIMIT).refreshAll();
});

export const editTransfer = guardedForm(TransferEditSchema, async (data, { ctx }) => {
	ctx.transaction.editTransfer(data.transferId, {
		amount: Math.abs(data.amount),
		date: data.date,
		notes: data.notes === undefined ? undefined : data.notes || null,
		...transferDirection(data)
	});
	await requested(listTransactions, REFRESH_LIMIT).refreshAll();
});

export const batchDeleteTransactions = guardedForm(
	BatchTransactionIdsSchema,
	async ({ ids }, { ctx }) => {
		ctx.transaction.delete(ids);
		await requested(listTransactions, REFRESH_LIMIT).refreshAll();
	}
);

export const batchValidateTransactions = guardedForm(
	BatchValidateSchema,
	async ({ ids, validated }, { ctx }) => {
		ctx.transaction.validate(ids, validated);
		await requested(listTransactions, REFRESH_LIMIT).refreshAll();
	}
);
