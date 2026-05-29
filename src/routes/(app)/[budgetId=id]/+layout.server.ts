import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoadEvent, PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(
	async (user, actions, event: LayoutServerLoadEvent) => {
		const { budgetId } = event.params;

		const budget = actions.budget.getById({ budgetId });
		if (!budget) error(404, 'Budget not found');

		const budgetUsers = actions.budget.getUsers({ budgetId });

		return { budget, budgetUsers, locale: getLocale(), user };
	}
);
