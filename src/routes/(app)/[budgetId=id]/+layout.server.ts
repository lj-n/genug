import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoadEvent, PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(
	async (user, actions, event: LayoutServerLoadEvent) => {
		const { budgets } = await event.parent();

		const budget = budgets.find((budget) => budget.id === event.params.budgetId);

		if (!budget) {
			error(404, 'Budget not found');
		}

		const users = actions.budget.users({ budgetId: budget.id });

		return { budget, locale: getLocale(), user, users };
	}
);
