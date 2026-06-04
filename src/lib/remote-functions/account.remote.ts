import { resolve } from '$app/paths';
import { form, query } from '$app/server';
import { actions } from '$db';
import { m } from '$lib/paraglide/messages';
import { AccountCreateSchema } from '$lib/schemas/account';
import { BudgetIdSchema } from '$lib/schemas/budget';
import { redirect } from '@sveltejs/kit';

import { requireUser } from './remote.utils';

export const getAccounts = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.account.getAllAccounts({ budgetId, userId: user.id });
});

export const createAccount = form(
	AccountCreateSchema,
	async ({ accountName, budgetId, startingBalance }) => {
		const [user] = requireUser();
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
