import { protectRoute } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
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
import { getCategories } from '$lib/server/categories';
import { getAccountsWithBalance } from '$lib/server/accounts';

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
		archivedCategories: getCategories(db, user.id, true).filter(
			(category) => category.retired
		),
		sleepingMoney: getSleepingMoney(db, user.id),
		accounts: getAccountsWithBalance(db, user.id),
		localDate,
		previousMonth,
		nextMonth,
		isCurrentMonth: params.date === formatDateToYearMonthString(new Date())
	};
});
