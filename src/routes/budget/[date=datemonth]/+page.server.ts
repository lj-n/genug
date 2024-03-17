import { protectRoute } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getBudget, getSleepingMoney, setBudget } from '$lib/server/budgets';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import {
	formatDateToYearMonthString,
	getPreviousAndLastMonth
} from '$lib/components/date.utils';

export const load: PageServerLoad = protectRoute(({ params }, user) => {
	const localDate = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		year: 'numeric'
	}).format(new Date(params.date));

	const [previousMonth, nextMonth] = getPreviousAndLastMonth(
		new Date(params.date)
	);

	return {
		budget: getBudget(db, user.id, params.date),
		sleepingMoney: getSleepingMoney(db, user.id),
		localDate,
		previousMonth,
		nextMonth,
		isCurrentMonth: params.date === formatDateToYearMonthString(new Date())
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
