import { withPermissions } from '$db/actions';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withPermissions(async (user, actions, _event) => {
	const allBudgets = await actions.budget.all();
	const accounts = await actions.account.all();

	const budgets = new Map<
		string,
		Awaited<ReturnType<typeof actions.budget.all>>[number] & {
			accounts: Awaited<ReturnType<typeof actions.account.all>>;
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
