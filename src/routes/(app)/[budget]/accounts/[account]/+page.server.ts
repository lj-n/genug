import { withPermissions } from '$db/actions';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (user, actions, event) => {
	const { budgets } = await event.parent();
	const budget = budgets.get(event.params.budget);

	if (!budget) {
		error(404, 'Budget not found');
	}

	const account = budget.accounts.find((account) => account.id === event.params.account);

	if (!account) {
		error(404, 'Account not found');
	}

	return { account };
});
