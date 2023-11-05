import { withAuth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withAuth(async (_, user) => {
	return { categories: user.category.getAll() };
});
