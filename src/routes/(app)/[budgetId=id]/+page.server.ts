import { createMonthParam } from '$lib/utils/date-utils';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	redirect(307, `/${event.params.budgetId}/${createMonthParam()}`);
};
