import { actions } from '$db';
import { getLocale } from '$lib/paraglide/runtime';
import { error, redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { locals, params } = event;
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const { budgetId } = params;

	const budget = actions.budget.getBudgetById({ budgetId, userId: user.id });
	if (!budget) error(404, { message: 'Dieser Budgetplan existiert nicht.' });

	const budgetUsers = actions.budget.getBudgetUsers({ budgetId, userId: user.id });

	return { budget, budgetUsers, currency: budget.currency, locale: getLocale(), user };
};
