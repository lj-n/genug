import { getAccountsWithBalance } from '$lib/server/accounts';
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = protectRoute((_, user) => {
	return {
		accounts: getAccountsWithBalance(db, user.id)
	};
});
