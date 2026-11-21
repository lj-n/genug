import {
	BatchTransactionIdsSchema,
	BatchValidateSchema,
	TransactionCreateSchema,
	TransactionEditSchema,
	TransferCreateSchema,
	TransferEditSchema
} from '$lib/schemas/transaction';
import { PAGE_SIZE_COOKIE_NAME, resolvePageSize } from '$lib/utils/page-size';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';

import { refreshRegisters } from './register-refresh';

/** The register's remembered default page size, read from the `pageSize` cookie. */
export const getRememberedPageSize = guardedQuery(async ({ event }) =>
	resolvePageSize(event.cookies.get(PAGE_SIZE_COOKIE_NAME))
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
		await refreshRegisters();
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
		await refreshRegisters();
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
	await refreshRegisters();
});

export const editTransfer = guardedForm(TransferEditSchema, async (data, { ctx }) => {
	ctx.transaction.editTransfer(data.transferId, {
		amount: Math.abs(data.amount),
		date: data.date,
		notes: data.notes === undefined ? undefined : data.notes || null,
		...transferDirection(data)
	});
	await refreshRegisters();
});

export const batchDeleteTransactions = guardedForm(
	BatchTransactionIdsSchema,
	async ({ ids }, { ctx }) => {
		ctx.transaction.delete(ids);
		await refreshRegisters();
	}
);

export const batchValidateTransactions = guardedForm(
	BatchValidateSchema,
	async ({ ids, validated }, { ctx }) => {
		ctx.transaction.validate(ids, validated);
		await refreshRegisters();
	}
);
