import { resolve } from '$app/paths';
import { actions } from '$db';
import { createMonthParam } from '$lib/utils/date-utils';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const [firstBudget] = actions.budget.getAllBudgets({ userId: user.id });

	if (!firstBudget) {
		redirect(307, resolve('/(app)/new'));
	}

	redirect(
		307,
		resolve('/(app)/[budgetId=id]/[month=month]', {
			budgetId: firstBudget.id,
			month: createMonthParam().toString()
		})
	);
};
