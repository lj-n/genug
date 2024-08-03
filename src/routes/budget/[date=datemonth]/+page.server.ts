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
import { setBudgetFormSchema } from './[id=integer]/schema';
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
