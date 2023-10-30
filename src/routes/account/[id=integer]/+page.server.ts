import { withAuth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	return {
		account: user.account.getWithTransactions(Number(params.id))
	};
});

export const actions = {} satisfies Actions;
