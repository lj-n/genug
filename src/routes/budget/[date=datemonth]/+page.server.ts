import { protectRoute } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMonthInFormat, getMonthYear } from '$lib/components/date.utils';
import { db } from '$lib/server/db';
import { getBudget, getSleepingMoney, setBudget } from '$lib/server/budgets';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

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

		const schema = zfd.formData({
			categoryId: zfd.numeric(z.number().int().positive()),
			budget: zfd.numeric(z.number().int().nonnegative())
		});

		const parsed = schema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { error: 'Invalid input.' });
		}

		try {
			setBudget(db, user.id, {
				categoryId: parsed.data.categoryId,
				amount: parsed.data.budget,
				date: params.date
			});
		} catch (error) {
			return fail(500, { error: 'Oops, something went wrong.' });
		}
	})
} satisfies Actions;
