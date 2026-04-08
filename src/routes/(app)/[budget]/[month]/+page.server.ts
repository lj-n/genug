import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = actions.budget.month({
		budgetId: event.params.budget,
		month: parseInt(event.params.month)
	});

	const archivedCategories = actions.category.archived({
		budgetId: event.params.budget
	});

	return {
		archivedCategories,
		categories,
		locale: getLocale()
	};
});
