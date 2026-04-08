import { withPermissions } from '$db/actions';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withPermissions((user, actions, _event) => {
	const allBudgets = actions.budget.all();
	const accounts = actions.account.all();

	const budgets = allBudgets.map((budget) => ({
		...budget,
		accounts: accounts.filter((account) => account.budgetId === budget.id)
	}));

	return { budgets, user };
});
