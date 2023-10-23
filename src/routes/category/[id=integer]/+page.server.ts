import { withAuth } from '$lib/server';
import { error } from '@sveltejs/kit';
import { getUserCategory } from '$lib/server/categories';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const categoryId = Number(params.id);
	const category = getUserCategory(user.userId, categoryId);

	if (!category) {
		throw error(404, 'Account not found');
	}

	return { category };
});
