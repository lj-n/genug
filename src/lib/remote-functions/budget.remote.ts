import { form, query } from '$app/server';
import { actions } from '$db';
import { m } from '$lib/paraglide/messages';
import {
	AssignmentSchema,
	BudgetAndUserIdSchema,
	BudgetIdSchema,
	BudgetMonthSchema,
	BudgetSchema,
	FindBudgetUserSchema,
	SetBudgetSchema,
	TransferAssignmentSchema
} from '$lib/schemas/budget';
import { error, redirect } from '@sveltejs/kit';

import { requireUser } from './remote.utils';

export const getBudgets = query(async () => {
	const [user] = requireUser();
	return actions.budget.getAllBudgets({ userId: user.id });
});

export const getBudget = query.batch(BudgetIdSchema, async () => {
	const [user] = requireUser();
	const budgets = actions.budget.getAllBudgets({ userId: user.id });
	const lookup = new Map(budgets.map((budget) => [budget.id, budget]));
	return ({ budgetId }) => {
		const found = lookup.get(budgetId);
		if (!found) error(404);
		return found;
	};
});

export const getBudgetUsers = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.budget.getBudgetUsers({ budgetId, userId: user.id });
});

export const createBudget = form(BudgetSchema, async (data) => {
	const [user] = requireUser();
	const budget = actions.budget.createBudget({ data, userId: user.id });
	redirect(303, `/${budget.id}`);
});

export const setBudget = form(SetBudgetSchema, async ({ budgetId, ...data }) => {
	const [user] = requireUser();
	actions.budget.setBudget({ budgetId, data, userId: user.id });
});

export const removeBudgetUser = form(BudgetAndUserIdSchema, async ({ budgetId, userId }) => {
	const [user] = requireUser();
	actions.budget.removeBudgetUser({ budgetId, userId: user.id, userIdToRemove: userId });
});

export const findEligibleUser = query(FindBudgetUserSchema, async ({ budgetId, inviteeName }) => {
	const [user] = requireUser();

	if (user.username === inviteeName) {
		return { error: m.budget_users_error_its_you() };
	}

	const budgetUsers = actions.budget.getBudgetUsers({ budgetId, userId: user.id });
	const existingMember = budgetUsers.find((u) => u.name === inviteeName);

	if (existingMember) {
		return {
			error:
				existingMember.role === 'INVITEE'
					? m.budget_users_error_already_invited({ value: inviteeName })
					: m.budget_users_error_already_access({ value: inviteeName })
		};
	}

	const eligibleUser = actions.budget
		.getEligibleUsers({ budgetId })
		.find((u) => u.name === inviteeName);

	if (!eligibleUser) {
		return { error: m.budget_users_error_not_found({ value: inviteeName }) };
	}

	return { eligible: true, userId: eligibleUser.id };
});

export const inviteUser = form(FindBudgetUserSchema, async ({ budgetId, inviteeName }) => {
	const [user] = requireUser();
	actions.budget.inviteBudgetUser({ budgetId, inviteeName, userId: user.id });
});

export const getBudgetMonth = query(BudgetMonthSchema, async ({ budgetId, month }) => {
	const [user] = requireUser();
	return actions.budget.getBudgetMonth({ budgetId, month, userId: user.id });
});

export const getBudgetUnassigned = query(BudgetIdSchema, async ({ budgetId }) => {
	const [user] = requireUser();
	return actions.budget.getBudgetUnassigned({ budgetId, userId: user.id });
});

export const assignBudget = form(AssignmentSchema, async (data) => {
	const [user] = requireUser();
	actions.budget.assignBudget({ ...data, userId: user.id });
});

export const transferBudget = form(
	TransferAssignmentSchema,
	async ({ fromCategoryId, ...data }) => {
		const [user] = requireUser();
		actions.budget.transferBudget({
			...data,
			fromCategoryId: fromCategoryId || null,
			userId: user.id
		});
	}
);
