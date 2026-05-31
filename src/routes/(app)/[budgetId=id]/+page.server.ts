import { withPermissions } from '$db/actions';
import { m } from '$lib/paraglide/messages';
import { createMonthParam } from '$lib/utils/date-utils';
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

import { schemaEditBudget, schemaInviteUser } from './schema';

export const load: PageServerLoad = withPermissions(
	async (_user, _actions, event: PageServerLoadEvent) => {
		redirect(307, `/${event.params.budgetId}/${createMonthParam()}`);
	}
);

export const actions = {
	acceptInvite: withPermissions(async (_user, actions, event) => {
		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) return fail(400);

		actions.budget.acceptInvite({ budgetId: event.params.budgetId });

		return { success: true };
	}),

	checkUser: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaInviteUser));

		if (!form.valid || !checkUserEligible(form, event.params.budgetId, user, actions)) {
			return fail(400, { form });
		}

		return { form };
	}),

	editBudget: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaEditBudget));
		if (!form.valid) return fail(400, { form });

		actions.budget.edit({ budgetId: event.params.budgetId, update: form.data });

		return message(form, { type: 'success' });
	}),

	inviteUser: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaInviteUser));
		if (!form.valid) return fail(400, { form });

		const foundUserId = checkUserEligible(form, event.params.budgetId, user, actions);
		if (!foundUserId) return fail(400, { form });

		actions.budget.inviteUser({ budgetId: event.params.budgetId, userId: foundUserId });

		return message(form, { type: 'success' });
	}),

	removeUser: withPermissions(async (_user, actions, event) => {
		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) return fail(400);

		actions.budget.removeUser({ budgetId: event.params.budgetId, removeUserId: userId });

		return { success: true };
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

	const budgetUsers = actions.budget.getUsers({ budgetId });
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
