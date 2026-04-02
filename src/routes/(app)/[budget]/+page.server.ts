import { withPermissions } from '$db/actions';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
function createMonthParam(date = new Date()) {
	return date.getFullYear() * 100 + (date.getMonth() + 1);
}

export const load: PageServerLoad = withPermissions(async (_user, _actions, event) => {
	redirect(307, `/${event.params.budget}/${createMonthParam()}`);
});
