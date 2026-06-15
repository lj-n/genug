import { m } from '$lib/paraglide/messages';
import {
	AssignmentSchema,
	BudgetAndUserIdSchema,
	BudgetMonthSchema,
	CreateBudgetSchema,
	EditBudgetSchema,
	FindBudgetUserSchema
} from '$lib/schemas/budget';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';
import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getBudgets = guardedQuery(async ({ ctx }) => ctx.budget.all());

export const getBudget = guardedQuery(v.string(), async (id, { ctx }) => ctx.budget.byId(id));

export const getBudgetUsers = guardedQuery(v.string(), async (id, { ctx }) => ctx.budget.users(id));

export const createBudget = guardedForm(CreateBudgetSchema, async (data, { ctx }) => {
	const id = ctx.budget.create(data);
	void getBudgets().refresh();
	redirect(302, `/${id}`);
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
	void getMonthly(data).refresh();
});

export const getInvitations = guardedQuery(async ({ ctx }) => ctx.budget.invitations());
