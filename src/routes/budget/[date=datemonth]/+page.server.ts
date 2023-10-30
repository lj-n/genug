import { withAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(({ params }, user) => {
	return { budgets: user.budget.get(params.date) };
});
