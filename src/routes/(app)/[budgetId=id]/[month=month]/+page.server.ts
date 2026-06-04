import { resolve } from '$app/paths';
import { withPermissions } from '$db/actions';
import { getLocale } from '$lib/paraglide/runtime';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { schemaCategoryCreate } from '../categories/new/schema';
import { schemaEditBudget, schemaInviteUser } from '../schema';
import { schemaMonthlyAssigment, schemaTransferAssignment } from './schema';

async function loadForms(budget: App.Budget) {
	const [monthlyAssignment, transferAssignment, categoryCreate, inviteUser, editBudget] =
		await Promise.all([
			superValidate(zod4(schemaMonthlyAssigment)),
			superValidate(zod4(schemaTransferAssignment)),
			superValidate(zod4(schemaCategoryCreate)),
			superValidate(zod4(schemaInviteUser), { id: 'invite-form' }),
			superValidate({ currency: budget.currency, name: budget.name }, zod4(schemaEditBudget))
		]);

	return {
		categoryCreate,
		editBudget,
		inviteUser,
		monthlyAssignment,
		transferAssignment
	};
}

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
		const budgetId = budget.id;

		const accounts = actions.account.all().filter((f) => f.budgetId === budgetId);

		if (accounts.length === 0) {
			redirect(307, resolve(`/(app)/[budgetId=id]/accounts/new`, { budgetId }));
		}

		return {
			archivedCategories,
			categories,
			forms: await loadForms(budget),
			locale: getLocale(),
			month: event.params.month,
			unassigned: unassigned?.sum || 0
		};
	}
);

export const actions = {
	assignment: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaMonthlyAssigment));
		if (!form.valid) return fail(400, { form });

		actions.budget.assign({
			budgetId: event.params.budgetId,
			month: parseInt(event.params.month),
			...form.data
		});

		return message(form, { type: 'success' });
	}),

	transfer: withPermissions(async (_user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaTransferAssignment));
		if (!form.valid) return fail(400, { form });

		actions.budget.transfer({
			amount: form.data.amount,
			budgetId: event.params.budgetId,
			fromCategoryId: form.data.fromCategoryId ?? null,
			month: parseInt(event.params.month),
			toCategoryId: form.data.toCategoryId
		});

		return message(form, { type: 'success' });
	})
} satisfies Actions;
