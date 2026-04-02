import { withPermissions } from '$db/actions';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withPermissions(async (user, _actions, event) => {
	const { budgets } = await event.parent();

	const budget = budgets.get(event.params.budget);

	if (!budget) {
		error(404, 'Budget not found');
	}

	return { budget, user };
});
