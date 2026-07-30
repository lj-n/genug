import { resolve } from '$app/paths';
import { requested } from '$app/server';
import { UNASSIGNED } from '$lib/constants';
import {
	AssignmentSchema,
	BudgetAndUserIdSchema,
	BudgetMonthSchema,
	CreateBudgetSchema,
	EditBudgetSchema,
	FindBudgetUserSchema,
	ReassignmentSchema
} from '$lib/schemas/budget';
import { OrderedIdsSchema } from '$lib/schemas/utils';
import { guardedCommand, guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

import { REFRESH_LIMIT } from './remote.utils';

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
		// Declining an invitation is a self-removal, so the nav's invitation
		// indicator must drop the row too (see docs/dev/remote-functions.md).
		void requested(getInvitations, REFRESH_LIMIT).refreshAll();
	}
);

export const findEligibleUser = guardedQuery(
	FindBudgetUserSchema,
	async ({ budgetId, inviteeName }, { ctx }) => ctx.budget.findEligibleUser(budgetId, inviteeName)
);

export const inviteUser = guardedForm(
	FindBudgetUserSchema,
	async ({ budgetId, inviteeName }, { ctx }) => {
		ctx.budget.invite(budgetId, inviteeName);
		void getBudgetUsers(budgetId).refresh();
	}
);

export const getMonthly = guardedQuery(BudgetMonthSchema, async ({ budgetId, month }, { ctx }) =>
	ctx.budget.monthly(budgetId, month)
);

export const getUnassigned = guardedQuery(BudgetMonthSchema, async ({ budgetId, month }, { ctx }) =>
	ctx.budget.unassigned(budgetId, month)
);

const refreshBudgetData = () =>
	Promise.all([
		requested(getMonthly, REFRESH_LIMIT).refreshAll(),
		requested(getUnassigned, REFRESH_LIMIT).refreshAll()
	]);

export const assignment = guardedForm(AssignmentSchema, async (data, { ctx }) => {
	ctx.budget.assignment(data);
	await refreshBudgetData();
});

export const getInvitations = guardedQuery(async ({ ctx }) => ctx.budget.invitations());

export const reorderBudgets = guardedCommand(OrderedIdsSchema, async (orderedIds, { ctx }) => {
	ctx.budget.reorder(orderedIds);
});

export const acceptInvite = guardedForm(BudgetAndUserIdSchema, async ({ budgetId }, { ctx }) => {
	ctx.budget.acceptInvite(budgetId);
	// Surface the newly-joined budget in the nav and drop the now-consumed
	// invitation indicator, both without a manual reload.
	void getBudgets().refresh();
	void getBudget(budgetId).refresh();
	void requested(getInvitations, REFRESH_LIMIT).refreshAll();
});

export const reassignment = guardedForm(ReassignmentSchema, async (data, { ctx }) => {
	ctx.budget.reassignment({
		amount: data.amount,
		budgetId: data.budgetId,
		month: data.month,
		sourceCategoryId: data.sourceCategoryId,
		targetCategoryId:
			data.targetCategoryId === UNASSIGNED || !data.targetCategoryId ? null : data.targetCategoryId
	});

	await refreshBudgetData();
});
