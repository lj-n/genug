import { withAuth } from '$lib/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	return {
		category: user.categories.getWithTransactions(Number(params.id))
	};
});
