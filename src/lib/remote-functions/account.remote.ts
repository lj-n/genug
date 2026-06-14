import { resolve } from '$app/paths';
import { actions } from '$db';
import { m } from '$lib/paraglide/messages';
import { AccountCreateSchema, AccountSetNameSchema } from '$lib/schemas/account';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getAccounts = guardedQuery(v.string(), async (budgetId, { user }) => {
	return actions.account.getAllAccounts({ budgetId, userId: user.id });
});

export const createAccount = guardedForm(
	AccountCreateSchema,
	async ({ accountName, budgetId, startingBalance }, { user }) => {
		const account = actions.account.createAccount({
			data: { budgetId, name: accountName, notes: m.account_create_starting_balance() },
			startingBalance,
			userId: user.id
		});
		redirect(
			303,
			resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId: account.id, budgetId })
		);
	}
);

export const getAccountById = guardedQuery(v.string(), async (id, { user }) => {
	const account = actions.account.getAccountById({ id, userId: user.id });
	if (!account) error(404, { message: m.error_account_not_found() });
	return account;
});

export const getAccountBalanceDetail = guardedQuery(v.string(), async (accountId, { user }) => {
	return actions.account.getAccountBalanceDetail({ accountId, userId: user.id });
});

export const setAccountName = guardedForm(
	AccountSetNameSchema,
	async ({ accountId, accountName }, { user }) => {
		actions.account.setAccountName({ accountId, name: accountName, userId: user.id });
	}
);
