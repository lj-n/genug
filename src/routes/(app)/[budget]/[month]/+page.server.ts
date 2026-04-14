import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = actions.budget.month({
		budgetId: event.params.budget,
		month: parseInt(event.params.month)
	});

	const archivedCategories = actions.category.archived({
		budgetId: event.params.budget
	});

	const { budget } = await event.parent();

	if (budget.accounts.length === 0) {
		redirect(307, `/${event.params.budget}/accounts/new`);
	}

	return {
		archivedCategories,
		categories,
		locale: getLocale()
	};
});
