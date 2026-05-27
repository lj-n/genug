import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { createAccountSchema } from '../accounts/new/schema';
import { createCategorySchema } from '../categories/new/schema';
import { schemaInviteUser } from '../schema';
import { assignmentSchema } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, actions, event: PageServerLoadEvent) => {
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
			assignmentForm: await superValidate(zod4(assignmentSchema)),
			categories,
			createAccountForm: await superValidate(zod4(createAccountSchema)),
			createCategoryForm: await superValidate(zod4(createCategorySchema)),
			formInviteUser: await superValidate(zod4(schemaInviteUser), { id: 'invite-form' }),
			locale: getLocale(),
			month: event.params.month,
			unassigned: unassigned?.sum || 0
		};
	}
);

export const actions = {
	assignment: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(assignmentSchema));

		if (!form.valid) return fail(400, { form });

		const { amount, categoryId } = form.data;

		actions.budget.assign({
			amount,
			budgetId: event.params.budgetId,
			categoryId,
			month: parseInt(event.params.month)
		});

		return message(form, { type: 'success' });
	})
} satisfies Actions;
