import { resolve } from '$app/paths';
import { withPermissions } from '$db/actions';
import { createMonthParam } from '$lib/utils/date-utils';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions) => {
	const [firstBudget] = actions.budget.all();

	redirect(
		307,
		resolve('/(app)/[budgetId=id]/[month=month]', {
			budgetId: firstBudget.id,
			month: createMonthParam().toString()
		})
	);
});
