import { resolve } from '$app/paths';
import { requested } from '$app/server';
import { UNASSIGNED } from '$lib/constants';
import { m } from '$lib/paraglide/messages';
import {
	AssignmentSchema,
	BudgetAndUserIdSchema,
	BudgetMonthSchema,
	CreateBudgetSchema,
	EditBudgetSchema,
	FindBudgetUserSchema,
	TransferAssignmentSchema
} from '$lib/schemas/budget';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import { guardedCommand, guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getBudgets = guardedQuery(async ({ ctx }) => ctx.budget.all());

export const getBudget = guardedQuery(v.string(), async (id, { ctx }) => ctx.budget.byId(id));

export const getBudgetUsers = guardedQuery(v.string(), async (id, { ctx }) => ctx.budget.users(id));

export const createBudget = guardedForm(CreateBudgetSchema, async (data, { ctx }) => {
	const budgetId = ctx.budget.create(data);
	void getBudgets().refresh();
	redirect(303, resolve('/(app)/[budgetId=id]', { budgetId }));
});

export const editBudget = guardedForm(EditBudgetSchema, async ({ budgetId, ...data }, { ctx }) => {
	ctx.budget.edit(budgetId, data);
	void getBudget(budgetId).refresh();
});

export const removeUser = guardedForm(
	BudgetAndUserIdSchema,
	async ({ budgetId, userId }, { ctx }) => {
		ctx.budget.removeUser(budgetId, userId);
		void getBudgetUsers(budgetId).refresh();
	}
);

export const findEligibleUser = guardedQuery(
	FindBudgetUserSchema,
	async ({ budgetId, inviteeName }, { ctx, user }) => {
		if (user.username === inviteeName) {
			return { error: m.budget_users_error_its_you() };
		}

		const budgetUsers = ctx.budget.users(budgetId);
		const existingMember = budgetUsers.find((u) => u.name === inviteeName);

		if (existingMember) {
			return {
				error:
					existingMember.role === 'INVITEE'
						? m.budget_users_error_already_invited({ value: inviteeName })
						: m.budget_users_error_already_access({ value: inviteeName })
			};
		}

		const eligibleUser = ctx.budget.eligibleUsers(budgetId).find((u) => u.name === inviteeName);

		if (!eligibleUser) {
			return { error: m.budget_users_error_not_found({ value: inviteeName }) };
		}

		return { eligible: true, userId: eligibleUser.id };
	}
);

export const inviteUser = guardedForm(
	FindBudgetUserSchema,
	async ({ budgetId, inviteeName }, { ctx }) => {
		const eligibleUser = ctx.budget.eligibleUsers(budgetId).find((f) => f.name === inviteeName);
		if (!eligibleUser) error(400);
		ctx.budget.invite(budgetId, eligibleUser.id);
	}
);

export const getMonthly = guardedQuery(BudgetMonthSchema, async ({ budgetId, month }, { ctx }) =>
	ctx.budget.monthly(budgetId, month)
);

export const getUnassigned = guardedQuery(v.string(), async (id, { ctx }) =>
	ctx.budget.unassigned(id)
);

export const assignment = guardedForm(AssignmentSchema, async (data, { ctx }) => {
	ctx.budget.assignment(data);
	await requested(getMonthly, 1).refreshAll();
	await requested(getUnassigned, 1).refreshAll();
});

export const getInvitations = guardedQuery(async ({ ctx }) => ctx.budget.invitations());

export const reorderBudgets = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.budget.reorder(orderedIds);
});

export const acceptInvite = guardedForm(BudgetAndUserIdSchema, async ({ budgetId }, { ctx }) => {
	ctx.budget.acceptInvite(budgetId);
	void getBudgets().refresh();
	void getBudget(budgetId).refresh();
});

export const transferAssignment = guardedForm(TransferAssignmentSchema, async (data, { ctx }) => {
	ctx.budget.transferAssignment({
		amount: data.amount,
		budgetId: data.budgetId,
		month: data.month,
		sourceCategoryId: data.sourceCategoryId,
		targetCategoryId:
			data.targetCategoryId === UNASSIGNED || !data.targetCategoryId ? null : data.targetCategoryId
	});

	await requested(getMonthly, 1).refreshAll();
	await requested(getUnassigned, 1).refreshAll();
});
