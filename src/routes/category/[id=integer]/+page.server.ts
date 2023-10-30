import { withAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	return {
		category: user.category.getWithTransactions(Number(params.id))
	};
});
