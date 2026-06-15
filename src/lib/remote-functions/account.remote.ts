import { resolve } from '$app/paths';
import { m } from '$lib/paraglide/messages';
import { AccountCreateSchema, AccountSetNameSchema } from '$lib/schemas/account';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import { guardedCommand, guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getAccounts = guardedQuery(v.string(), async (budgetId, { ctx }) =>
	ctx.account.all(budgetId)
);

export const createAccount = guardedForm(
	AccountCreateSchema,
	async ({ accountName, budgetId, startingBalance }, { ctx }) => {
		const account = ctx.account.create(
			{ budgetId, name: accountName, notes: m.account_create_starting_balance() },
			startingBalance
		);
		redirect(
			303,
			resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId: account.id, budgetId })
		);
	}
);

export const getAccount = guardedQuery(v.string(), async (id, { ctx }) => ctx.account.byId(id));

export const getAccountBalances = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.account.balances(accountId)
);

export const editAccount = guardedForm(
	AccountSetNameSchema,
	async ({ accountId, accountName }, { ctx }) => {
		ctx.account.edit(accountId, accountName);
	}
);

export const reorderAccounts = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.account.reorder(orderedIds);
});
