import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoadEvent, PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(
	async (user, _actions, event: LayoutServerLoadEvent) => {
		const { budgets } = await event.parent();

		const budget = budgets.get(event.params.budget);

		if (!budget) {
			error(404, 'Budget not found');
		}

		return { budget, locale: getLocale(), user };
	}
);
