import { protectRoute } from '$lib/server/auth';
import { fail, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { setBudgetFormSchema } from './schema';
import { getBudget, setBudget } from '$lib/server/budgets';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = protectRoute(async ({ params }, user) => {
	const localDate = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		year: 'numeric'
	}).format(new Date(params.date));

	const budget = getBudget(db, user.id, params.date).find(
		(budget) => budget.id === Number(params.id)
	);

	if (!budget) error(404, 'Budget not found');

	return {
		budget,
		localDate,
		form: await superValidate(
			{ budget: budget.budget, categoryId: budget.id },
			zod(setBudgetFormSchema)
		)
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
			form.errors.budget = ['Oops, something went wrong.'];
			return fail(500, { form });
		}
	})
} satisfies Actions;
