/**
 * Response assembly for the native-client API (map #190, ticket #195).
 *
 * Each function is a thin adapter over a `UserCtx`: it calls the same domain
 * commands/queries the web app uses and shapes the result into a contract
 * response (`src/lib/server/api/contract.ts`). All access control, validation,
 * and persistence rules live in `user-context` — these functions add only the
 * "fat write" bookkeeping the contract requires (map decision 5): the
 * server-recomputed `EnvelopeDelta` and affected account balances returned
 * inside each write's own response, so a native client never recomputes
 * envelope math locally.
 *
 * `ctx` is injected rather than built here so the assembly can be unit-tested
 * against an isolated in-memory database; the `+server.ts` routes supply the
 * real, request-scoped context.
 */

import type { UserCtx } from '$db/user-context';
import type { ListTransaction, TransactionSortParam } from '$db/user-context/transaction';
import type { Month } from '$lib/utils/month';

import { error } from '@sveltejs/kit';

export type AssignmentBody = { amount: number; budgetId: string; categoryId: string; month: Month };
export type ListTransactionsParams = {
	accountId: string;
	categoryId?: null | string[];
	notes?: null | string;
	page: number;
	pageSize: number;
	sortAccount?: 'asc' | 'desc' | null;
	sortAmount?: 'asc' | 'desc' | null;
	sortCategory?: 'asc' | 'desc' | null;
	sortDate?: 'asc' | 'desc' | null;
	sortValidated?: 'asc' | 'desc' | null;
};

export type ReassignmentBody = {
	amount: number;
	budgetId: string;
	month: Month;
	sourceCategoryId: string;
	targetCategoryId: null | string;
};

export type TransactionCreateBody = {
	accountId: string;
	amount: number;
	budgetId: string;
	categoryId?: string;
	date?: string;
	notes?: string;
	validated: boolean;
};

export type TransactionEditBody = {
	accountId?: string;
	amount?: number;
	categoryId?: string;
	date?: string;
	notes?: string;
	validated: boolean;
};

export type TransferCreateBody = {
	amount: number;
	budgetId: string;
	date?: string;
	fromAccountId: string;
	notes?: string;
	toAccountId: string;
};

export type TransferEditBody = {
	amount?: number;
	date?: string;
	fromAccountId?: string;
	notes?: null | string;
	toAccountId?: string;
};

type AccountBalance = { accountId: string; balance: number };

type CategoryBalance = {
	activity: number;
	assigned: number;
	categoryId: string;
	remaining: number;
};

export function createTransaction(
	ctx: UserCtx,
	userId: string,
	body: TransactionCreateBody,
	month: Month
) {
	const transaction = ctx.transaction.create({
		accountId: body.accountId,
		amount: body.amount,
		budgetId: body.budgetId,
		categoryId: body.categoryId || null,
		createdBy: userId,
		date: body.date,
		notes: body.notes || null,
		validated: body.validated
	});

	return {
		accounts: accountBalances(ctx, [transaction.accountId]),
		envelope: envelopeDelta(ctx, transaction.budgetId, month, [transaction.categoryId]),
		transaction
	};
}

export function createTransfer(ctx: UserCtx, body: TransferCreateBody) {
	const { from, to } = ctx.transaction.transfer({
		amount: body.amount,
		budgetId: body.budgetId,
		date: body.date,
		fromAccountId: body.fromAccountId,
		notes: body.notes ?? null,
		toAccountId: body.toAccountId
	});

	return { accounts: accountBalances(ctx, [from.accountId, to.accountId]), from, to };
}

export function deleteTransaction(ctx: UserCtx, transactionId: string, month: Month) {
	// Deleting a transfer leg removes both legs (ADR-0015), so more than one
	// row can come back — an empty result means unknown/inaccessible id.
	const deleted = ctx.transaction.delete([transactionId]);
	if (deleted.length === 0) error(404);

	return {
		accounts: accountBalances(
			ctx,
			deleted.map((transaction) => transaction.accountId)
		),
		deletedIds: deleted.map((transaction) => transaction.id),
		envelope: envelopeDelta(
			ctx,
			deleted[0].budgetId,
			month,
			deleted.map((transaction) => transaction.categoryId)
		)
	};
}

export function editTransaction(
	ctx: UserCtx,
	transactionId: string,
	body: TransactionEditBody,
	month: Month
) {
	// Read the pre-edit row so a category or account move can surface both
	// sides in the fat response (the contract's "up to two" affected sets).
	const before = ctx.transaction.byId(transactionId);

	const transaction = ctx.transaction.edit(transactionId, {
		accountId: body.accountId,
		amount: body.amount,
		categoryId: body.categoryId === undefined ? undefined : body.categoryId || null,
		date: body.date,
		notes: body.notes === undefined ? undefined : body.notes || null,
		validated: body.validated
	});

	return {
		accounts: accountBalances(ctx, [before.accountId, transaction.accountId]),
		envelope: envelopeDelta(ctx, transaction.budgetId, month, [
			before.categoryId,
			transaction.categoryId
		]),
		transaction
	};
}

export function editTransfer(ctx: UserCtx, transferId: string, body: TransferEditBody) {
	const { from, to } = ctx.transaction.editTransfer(transferId, {
		amount: body.amount,
		date: body.date,
		fromAccountId: body.fromAccountId,
		notes: body.notes,
		toAccountId: body.toAccountId
	});

	return { accounts: accountBalances(ctx, [from.accountId, to.accountId]), from, to };
}

export function getEnvelopeView(ctx: UserCtx, budgetId: string, month: Month) {
	ctx.budget.byId(budgetId); // 404 for an unknown or inaccessible budget.
	return {
		categories: ctx.budget.monthly(budgetId, month),
		month,
		unassigned: ctx.budget.unassigned(budgetId, month)
	};
}

export function listAccounts(ctx: UserCtx, budgetId: string) {
	ctx.budget.byId(budgetId); // 404 for an unknown or inaccessible budget.
	return ctx.account.all(budgetId);
}

export function listBudgets(ctx: UserCtx) {
	return ctx.budget.all();
}

export function listCategories(ctx: UserCtx, budgetId: string) {
	ctx.budget.byId(budgetId); // 404 for an unknown or inaccessible budget.
	return ctx.category.all(budgetId);
}

export function listTransactions(ctx: UserCtx, params: ListTransactionsParams) {
	ctx.account.byId(params.accountId); // 404 for an unknown or inaccessible account.

	const filter = {
		accountId: params.accountId,
		...(params.categoryId?.length ? { categoryId: params.categoryId } : {}),
		...(params.notes ? { notes: params.notes } : {})
	};

	const sort: TransactionSortParam = {
		...(params.sortCategory ? { category: params.sortCategory } : {}),
		...(params.sortAccount ? { account: params.sortAccount } : {}),
		...(params.sortDate ? { date: params.sortDate } : {}),
		...(params.sortAmount ? { amount: params.sortAmount } : {}),
		...(params.sortValidated ? { validated: params.sortValidated } : {})
	};

	// The API paginates from page 1; the domain query is zero-based.
	const { rows, total } = ctx.transaction.page(filter, sort, {
		page: params.page - 1,
		pageSize: params.pageSize
	});

	return { rows, total };
}

export function reassign(ctx: UserCtx, body: ReassignmentBody) {
	ctx.budget.reassignment({
		amount: body.amount,
		budgetId: body.budgetId,
		month: body.month,
		sourceCategoryId: body.sourceCategoryId,
		targetCategoryId: body.targetCategoryId
	});
	return envelopeDelta(ctx, body.budgetId, body.month, [
		body.sourceCategoryId,
		body.targetCategoryId
	]);
}

export function setAssignment(ctx: UserCtx, body: AssignmentBody) {
	ctx.budget.assignment({
		amount: body.amount,
		budgetId: body.budgetId,
		categoryId: body.categoryId,
		month: body.month
	});
	return envelopeDelta(ctx, body.budgetId, body.month, [body.categoryId]);
}

/** Recomputed all-time balances of the given accounts (deduplicated). */
function accountBalances(ctx: UserCtx, accountIds: string[]): AccountBalance[] {
	return [...new Set(accountIds)].map((id) => {
		const account = ctx.account.byId(id);
		return { accountId: account.id, balance: account.balance };
	});
}

/**
 * The `EnvelopeDelta` every write carries: `unassigned` recomputed for the
 * client's viewed month, plus the month-scoped balances of the affected
 * categories only (nulls — income legs — drop out, leaving `categories` empty
 * for a pure income write).
 */
function envelopeDelta(
	ctx: UserCtx,
	budgetId: string,
	month: Month,
	affectedCategoryIds: (null | string)[]
) {
	const affected = new Set(affectedCategoryIds.filter((id): id is string => id !== null));

	const categories: CategoryBalance[] = affected.size
		? ctx.budget
				.monthly(budgetId, month)
				.filter((category) => affected.has(category.id))
				.map((category) => ({
					activity: category.activity,
					assigned: category.assigned,
					categoryId: category.id,
					remaining: category.remaining
				}))
		: [];

	return { categories, month, unassigned: ctx.budget.unassigned(budgetId, month) };
}

/** Re-exported for tests that assert against the register row shape. */
export type { ListTransaction };
