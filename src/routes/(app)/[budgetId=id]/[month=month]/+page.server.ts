import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { PageServerLoad } from './$types';

import { createCategorySchema } from '../categories/new/schema';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const categories = actions.budget.month({
		budgetId: event.params.budgetId,
		month: parseInt(event.params.month)
	});

	const archivedCategories = actions.category.archived({
		budgetId: event.params.budgetId
	});

	const unassigned = actions.budget.getUnassigned({ budgetId: event.params.budgetId });

	const { budget } = await event.parent();

	if (budget.accounts.length === 0) {
		redirect(307, `/${event.params.budgetId}/accounts/new`);
	}

	return {
		archivedCategories,
		categories,
		createCategoryForm: await superValidate(zod4(createCategorySchema)),
		locale: getLocale(),
		month: event.params.month,
		unassigned: unassigned?.sum || 0
	};
});
