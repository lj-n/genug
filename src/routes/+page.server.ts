import type { PageServerLoad } from './$types';
import { protectRoute } from '$lib/server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await protectRoute(locals);

	return { user };
};
