import { getUserAccountsWithBalance } from '$lib/server/account';
import { protectRoute } from '$lib/server/auth';
import { getUserCategories } from '$lib/server/category';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = protectRoute(async (_, user) => {
	return {
		categories: getUserCategories(db, user.id),
		accounts: getUserAccountsWithBalance(db, user.id)
	};
});
