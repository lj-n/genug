import type { TransactionFilterParam, TransactionSortParam } from '$lib/server/db/transaction';

import { form, query, requested } from '$app/server';
import { actions } from '$db';
import {
	BatchTransactionIdsSchema,
	BatchValidateSchema,
	ListTransactionsSchema,
	TransactionCreateSchema,
	TransactionEditSchema
} from '$lib/schemas/transaction';

import { requireUser } from './remote.utils';

export const listTransactions = query(
	ListTransactionsSchema,
	async ({
		accountId,
		categoryId,
		notes,
		page,
		pageSize,
		sortAccount,
		sortCategory,
		sortDate,
		sortValidated
	}) => {
		const [user] = requireUser();

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

		const { transactions } = actions.transaction.listTransactions({
			filter,
			pagination: { page: page - 1, pageSize },
			sort,
			userId: user.id
		});

		const { transactions: allTransactions } = actions.transaction.listTransactions({
			filter,
			userId: user.id
		});

		return {
			pagination: { page, pageSize, totalTransactionCount: allTransactions.length },
			transactions
		};
	}
);

export const createTransaction = form(TransactionCreateSchema, async (data) => {
	const [user] = requireUser();
	actions.transaction.createTransaction({
		data: {
			accountId: data.accountId,
			amount: data.amount,
			budgetId: data.budgetId,
			categoryId: data.categoryId || null,
			createdBy: user.id,
			date: data.date,
			notes: data.notes || null,
			validated: data.validated
		},
		userId: user.id
	});
});

export const editTransaction = form(
	TransactionEditSchema,
	async ({ categoryId, notes, transactionId, ...rest }) => {
		const [user] = requireUser();
		const update = {
			...rest,
			categoryId: categoryId === undefined ? undefined : categoryId || null,
			notes: notes === undefined ? undefined : notes || null,
			validated: rest.validated ?? false
		};
		actions.transaction.updateTransaction({ id: transactionId, update, userId: user.id });

		await requested(listTransactions, 1).refreshAll();
	}
);

export const batchDeleteTransactions = form(BatchTransactionIdsSchema, async ({ ids }) => {
	const [user] = requireUser();
	actions.transaction.batchDeleteTransactions({ ids, userId: user.id });

	await requested(listTransactions, 1).refreshAll();
});

export const batchValidateTransactions = form(BatchValidateSchema, async ({ ids, validated }) => {
	const [user] = requireUser();
	actions.transaction.batchValidateTransactions({ ids, userId: user.id, validated });

	await requested(listTransactions, 1).refreshAll();
});
