import { withPermissions } from '$db/actions';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withPermissions((user, actions, _event) => {
	const budgets = actions.budget.all();
	const accounts = actions.account.all();

	const invitations = actions.budget.getInvitations();

	return { accounts, budgets, invitations, user };
});
