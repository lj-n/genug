import { withAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth((_, user) => {
	return {
		accounts: user.account.getAll(),
		categories: user.category.getAll(),
		transactions: user.transaction.getAll(),
		teams: user.team.getAll()
	};
});
