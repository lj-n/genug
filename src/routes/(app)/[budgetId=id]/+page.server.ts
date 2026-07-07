import { currentMonth, toParam } from '$lib/utils/month';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	redirect(307, `/${event.params.budgetId}/${toParam(currentMonth())}`);
};
