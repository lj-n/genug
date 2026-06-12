import { resolve } from '$app/paths';
import { actions } from '$db';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async (event: PageServerLoadEvent) => {
	const { locals } = event;
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const { budget } = await event.parent();
	const accounts = actions.account
		.getAllAccounts({ userId: user.id })
		.filter((a) => a.budgetId === budget.id);

	if (accounts.length === 0) {
		redirect(307, resolve(`/(app)/[budgetId=id]/accounts/new`, { budgetId: budget.id }));
	}
};
