import { getAccounts, getAccountsWithBalance } from '$lib/server/accounts';
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = protectRoute((_, user) => {
	return {
		accounts: getAccountsWithBalance(db, user.id)
	};
});

export const actions = {} satisfies Actions;
