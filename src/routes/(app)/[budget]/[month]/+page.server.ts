import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (user, actions, event) => {
	const categories = await actions.budget.month({
		budgetId: event.params.budget,
		month: parseInt(event.params.month)
	});

	const { budget } = await event.parent();

	return { budget, categories, locale: getLocale() };
});
