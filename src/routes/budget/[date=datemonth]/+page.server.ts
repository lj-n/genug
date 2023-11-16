import { withAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMonthInFormat, getMonthYear } from '$lib/components/date.utils';

export const load: PageServerLoad = withAuth(({ params }, user) => {
	const currentDate = new Date(params.date);
	const formattedDate = getMonthYear(currentDate);

	currentDate.setMonth(currentDate.getMonth() - 1);
	const previousMonth = getMonthInFormat(currentDate);

	currentDate.setMonth(currentDate.getMonth() + 2);
	const nextMonth = getMonthInFormat(currentDate);

	return {
		budgets: user.budget.get(params.date),
		previousMonth,
		nextMonth,
		formattedDate,
    date: params.date
	};
});

export const actions = {
	default: withAuth(async ({ params, request }, user) => {
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
			user.budget.set({
				categoryId: Number(categoryId),
				date: params.date,
				amount: parseInt(budget)
			});
		} catch (er) {
			console.log('🛸 < file: +page.server.ts:31 < er =', er);
			return fail(500, { error: 'Oops, something went wrong.' });
			//
		}

		return { success: true };
	})
} satisfies Actions;
