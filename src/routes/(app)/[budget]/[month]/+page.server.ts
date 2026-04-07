import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = await actions.budget.month({
		budgetId: event.params.budget,
		month: parseInt(event.params.month)
	});

	return {
		categories,
		locale: getLocale()
	};
});
