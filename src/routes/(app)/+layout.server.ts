import { withPermissions } from '$db/actions';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withPermissions((user, actions, _event) => {
	const allBudgets = actions.budget.all();
	const accounts = actions.account.all();

	const budgets = new Map<
		string,
		ReturnType<typeof actions.budget.all>[number] & {
			accounts: ReturnType<typeof actions.account.all>;
		}
	>();

	for (const budget of allBudgets) {
		budgets.set(budget.id, {
			...budget,
			accounts: accounts.filter((account) => account.budgetId === budget.id)
		});
	}

	return {
		budgets,
		user
	};
});
