import { withPermissions } from '$db/actions';
import * as m from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const account = actions.account.getById({ id: event.params.accountId });
	if (!account) error(404, { message: m.error_account_not_found() });

	return { account };
});
