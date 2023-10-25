import { withAuth } from '$lib/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	return {
		account: user.accounts.getWithTransactions(Number(params.id))
	};
});

export const actions = {} satisfies Actions;
