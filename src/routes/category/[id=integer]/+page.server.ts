import { withAuth } from '$lib/server';
import { error } from '@sveltejs/kit';
import { getUserCategory } from '../category.utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const categoryId = Number(params.id);
	const category = await getUserCategory(user.userId, categoryId);

	if (!category) {
		throw error(404, 'Account not found');
	}

	return { category };
});

export const actions = {} satisfies Actions;
