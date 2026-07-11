import { resolve } from '$app/paths';
import { AccountCreateSchema, AccountSetNameSchema } from '$lib/schemas/account';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import {
	guardedBatchQuery,
	guardedCommand,
	guardedForm,
	guardedQuery
} from '$server/utils/remote-guard';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getAccounts = guardedQuery(v.string(), async (budgetId, { ctx }) =>
	ctx.account.all(budgetId)
);

export const createAccount = guardedForm(
	AccountCreateSchema,
	async ({ accountName, budgetId, startingBalance }, { ctx, invalid: issue }) => {
		let account;
		try {
			account = ctx.account.create({ budgetId, name: accountName }, startingBalance);
		} catch (error) {
			if (isHttpError(error, 400)) invalid(issue.accountName(error.body.message));
			throw error;
		}
		redirect(
			303,
			resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId: account.id, budgetId })
		);
	}
);

export const getAccount = guardedQuery(v.string(), async (id, { ctx }) => ctx.account.byId(id));

export const getAccountBalances = guardedBatchQuery(v.string(), async (accountIds, { ctx }) => {
	const results = await Promise.all(accountIds.map((accountId) => ctx.account.balances(accountId)));
	return (_arg, idx) => results[idx];
});

export const editAccount = guardedForm(
	AccountSetNameSchema,
	async ({ accountId, accountName }, { ctx, invalid: issue }) => {
		try {
			ctx.account.edit(accountId, accountName);
		} catch (error) {
			if (isHttpError(error, 400)) invalid(issue.accountName(error.body.message));
			throw error;
		}
	}
);

export const reorderAccounts = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.account.reorder(orderedIds);
});
