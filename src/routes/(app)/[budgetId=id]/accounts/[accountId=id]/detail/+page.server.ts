import { withPermissions } from '$db/actions';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const account = actions.account.getById({ id: event.params.accountId });
	if (!account) error(404, 'Account not found');

	return { account };
});
