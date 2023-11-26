import { protectRoute } from '$lib/server/auth';
import { getUserCategories } from '$lib/server/category';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = protectRoute(async (_, { userId }) => {
	return { categories: getUserCategories(db, userId) };
});
