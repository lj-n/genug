import { withPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { fail, redirect } from '@sveltejs/kit';
import {
	type Infer,
	message,
	setError,
	superValidate,
	type SuperValidated
} from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';

import { createAccountSchema } from '../accounts/new/schema';
import { createCategorySchema } from '../categories/new/schema';
import { assignmentSchema, schemaInviteUser } from './schema';

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
	}),

	check: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaInviteUser));

		if (!form.valid || !checkUserEligible(form, event.params.budgetId, user, actions)) {
			return fail(400, { form });
		}

		return { form };
	}),

	inviteUser: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaInviteUser));
		if (!form.valid) return fail(400, { form });

		const foundUserId = checkUserEligible(form, event.params.budgetId, user, actions);
		if (!foundUserId) return fail(400, { form });

		actions.budget.inviteUser({ budgetId: event.params.budgetId, userId: foundUserId });

		return message(form, { type: 'success' });
	})
} satisfies Actions;

function checkUserEligible(
	form: SuperValidated<Infer<typeof schemaInviteUser>>,
	budgetId: string,
	user: App.User,
	actions: App.Actions
): null | string {
	if (user.username === form.data.invite) {
		setError(form, 'invite', m.budget_users_error_its_you());
		return null;
	}

	const budgetUsers = actions.budget.users({ budgetId });
	const foundBudgetUser = budgetUsers.find(({ name }) => name === form.data.invite);

	if (foundBudgetUser) {
		const errMsg =
			foundBudgetUser.role === 'INVITEE'
				? m.budget_users_error_already_invited({ value: form.data.invite })
				: m.budget_users_error_already_access({ value: form.data.invite });

		setError(form, 'invite', errMsg);
		return null;
	}

	const notBudgetUsers = actions.budget.eligibleUsers({ budgetId });
	const foundUser = notBudgetUsers.find(({ name }) => name === form.data.invite);

	if (!foundUser) {
		setError(form, 'invite', m.budget_users_error_not_found({ value: form.data.invite }));
		return null;
	}

	return foundUser.id;
}
