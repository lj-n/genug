import { protectRoute } from '$lib/server/auth';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = protectRoute((_, user) => {
	return {
		categories: getCategories(db, user.id)
	};
});
