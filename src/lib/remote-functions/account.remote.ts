import { resolve } from '$app/paths';
import { requested } from '$app/server';
import { AccountCreateSchema, AccountIdSchema, AccountSetNameSchema } from '$lib/schemas/account';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import {
	guardedBatchQuery,
	guardedCommand,
	guardedForm,
	guardedQuery
} from '$server/utils/remote-guard';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

import { REFRESH_LIMIT } from './remote.utils';

export const getAccounts = guardedQuery(v.string(), async (budgetId, { ctx }) =>
	ctx.account.all(budgetId)
);

export const getArchivedAccounts = guardedQuery(v.string(), async (budgetId, { ctx }) =>
	ctx.account.archived(budgetId)
);

export const getAccountArchivability = guardedBatchQuery(AccountIdSchema, async (args, { ctx }) => {
	const results = await Promise.all(
		args.map(({ accountId }) => ctx.account.archivability(accountId))
	);
	return (_arg, idx) => results[idx];
});

export const getAccountDeletability = guardedBatchQuery(AccountIdSchema, async (args, { ctx }) => {
	const results = await Promise.all(
		args.map(({ accountId }) => ctx.account.deletability(accountId))
	);
	return (_arg, idx) => results[idx];
});

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

export const archiveAccount = guardedForm(AccountIdSchema, async ({ accountId }, { ctx }) => {
	ctx.account.archive(accountId);
});

export const restoreAccount = guardedForm(AccountIdSchema, async ({ accountId }, { ctx }) => {
	ctx.account.restore(accountId);
});

export const deleteAccount = guardedForm(AccountIdSchema, async ({ accountId }, { ctx }) => {
	ctx.account.delete(accountId);
	await requested(getAccounts, REFRESH_LIMIT).refreshAll();
});

export const reorderAccounts = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.account.reorder(orderedIds);
});
