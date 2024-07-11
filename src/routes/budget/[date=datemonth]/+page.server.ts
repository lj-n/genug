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
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { getTeam, getTeams } from '$lib/server/teams';

export const load: PageServerLoad = protectRoute(async ({ params }, user) => {
	const localDate = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		year: 'numeric'
	}).format(new Date(params.date));

	const [previousMonth, nextMonth] = getPreviousAndLastMonth(
		new Date(params.date)
	);

	const budget = getBudget(db, user.id, params.date);

	return {
		form: await superValidate(zod(formSchema)),
		teams: getTeams(db, user.id)
			.map(({ team }) => getTeam(db, team.id))
			.filter((team) => team !== undefined),
		budget,
		sleepingMoney: getSleepingMoney(db, user.id),
		localDate,
		previousMonth,
		nextMonth,
		isCurrentMonth: params.date === formatDateToYearMonthString(new Date())
	};
});

export const actions = {
	default: protectRoute(async (event, user) => {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			console.log(form);
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
