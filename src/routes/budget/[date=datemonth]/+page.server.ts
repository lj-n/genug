import { protectRoute } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getBudget, getSleepingMoney, setBudget } from '$lib/server/budgets';
import {
	formatDateToYearMonthString,
	getPreviousAndLastMonth
} from '$lib/components/date.utils';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { setBudgetFormSchema } from './schema';
import { getTeam, getTeams } from '$lib/server/teams';
import { createCategoryFormSchema } from '../../categories/schema';

export const load: PageServerLoad = protectRoute(async ({ params, url }, user) => {
	const localDate = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		year: 'numeric'
	}).format(new Date(params.date));

	const [previousMonth, nextMonth] = getPreviousAndLastMonth(
		new Date(params.date)
	);

	const budget = getBudget(db, user.id, params.date);

	return {
		createCategoryForm: await superValidate(zod(createCategoryFormSchema)),
		teams: getTeams(db, user.id)
			.map(({ team }) => getTeam(db, team.id))
			.filter((team) => team !== undefined),
		budget,
		sleepingMoney: getSleepingMoney(db, user.id),
		localDate,
		previousMonth,
		nextMonth,
		isCurrentMonth: params.date === formatDateToYearMonthString(new Date()),
		selectedBudget: url.searchParams.get('selectedBudget'),
		randId: crypto.randomUUID()
	};
});

export const actions = {
	default: protectRoute(async (event, user) => {
		const form = await superValidate(event, zod(setBudgetFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			setBudget(db, user.id, {
				categoryId: form.data.categoryId,
				amount: form.data.budget,
				date: event.params.date
			});
			return { form };
		} catch (error) {
			console.log(error);
			form.errors.budget = ['Oops, something went wrong.'];
			return fail(500, { form });
		}
	})
} satisfies Actions;
