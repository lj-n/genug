import { withAuth } from '$lib/server';
import { error } from '@sveltejs/kit';
import { getUserAccount } from '$lib/server/accounts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const accountId = Number(params.id);
	const account = await getUserAccount(user.userId, accountId);

	if (!account) {
		throw error(404, 'Account not found');
	}

	return { account };
});

export const actions = {} satisfies Actions;
