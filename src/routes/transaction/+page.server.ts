import { withAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth((_, user) => {
	return { transactions: user.transaction.getAll() };
});
