import { protectRoute } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMonthInFormat, getMonthYear } from '$lib/components/date.utils';
import { db } from '$lib/server/db';
import { getBudget, getSleepingMoney, setBudget } from '$lib/server/budgets';

export const load: PageServerLoad = protectRoute(({ params }, user) => {
	const currentDate = new Date(params.date);
	const formattedDate = getMonthYear(currentDate);

	currentDate.setMonth(currentDate.getMonth() - 1);
	const previousMonth = getMonthInFormat(currentDate);

	currentDate.setMonth(currentDate.getMonth() + 2);
	const nextMonth = getMonthInFormat(currentDate);

	return {
		budget: getBudget(db, user.id, params.date),
		sleepingMoney: getSleepingMoney(db, user.id),
		previousMonth,
		nextMonth,
		formattedDate,
		date: params.date
	};
});

export const actions = {
	default: protectRoute(async ({ params, request }, user) => {
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
			setBudget(db, user.id, {
				categoryId: Number(categoryId),
				amount: Number(budget),
				date: params.date
			});
		} catch (error) {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	})
} satisfies Actions;
