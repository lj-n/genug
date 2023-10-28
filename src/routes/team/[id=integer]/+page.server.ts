import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { withAuth } from '$lib/server';
export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	try {
		const team = user.team.get(Number(params.id));
		return { userId: user.id, ...team.getSerializedInfo() };
	} catch (_e) {
		throw error(404, 'Team not found');
	}
});

export const actions = {} satisfies Actions;
