import { protectRoute } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMonthInFormat, getMonthYear } from '$lib/components/date.utils';
import {
	getUnassignedUserBudget,
	getUserBudgets,
	setUserBudget
} from '$lib/server/budget';
import { db } from '$lib/server/db';

export const load: PageServerLoad = protectRoute(({ params }, { userId }) => {
	const currentDate = new Date(params.date);
	const formattedDate = getMonthYear(currentDate);

	currentDate.setMonth(currentDate.getMonth() - 1);
	const previousMonth = getMonthInFormat(currentDate);

	currentDate.setMonth(currentDate.getMonth() + 2);
	const nextMonth = getMonthInFormat(currentDate);

	return {
		budgets: getUserBudgets(db, userId, params.date),
		assignable: getUnassignedUserBudget(db, userId),
		previousMonth,
		nextMonth,
		formattedDate,
		date: params.date
	};
});

export const actions = {
	default: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();
		const budget = formData.get('budget')?.toString();

		if (!categoryId || !budget) {
			return fail(400, {
				categoryId,
				budget,
				error: 'Category id or budget value missing.'
			});
		}

		try {
			setUserBudget(db, userId, {
				categoryId: Number(categoryId),
				amount: parseInt(budget),
				date: params.date
			});
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	})
} satisfies Actions;
