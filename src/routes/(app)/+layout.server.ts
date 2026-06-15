import { actions } from '$db';
import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const budgets = actions.budget.getAllBudgets({ userId: user.id });
	const accounts = actions.account.getAllAccounts({ userId: user.id });

	return { accounts, budgets, user };
};
