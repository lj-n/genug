import { protectRoute } from '$lib/server/auth';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { createTransactionSchema } from './schema';
import { getAccounts } from '$lib/server/accounts';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import { createServerTransactionSchema } from './schema.server';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		form: await superValidate(zod(createServerTransactionSchema(db, user))),
		categories: getCategories(db, user.id),
		accounts: getAccounts(db, user.id)
	};
});

export const actions = {
	default: protectRoute(async ({ request }, user) => {
		const form = await superValidate(
			request,
			zod(createServerTransactionSchema(db, user))
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		return message(form, { type: 'success', text: 'Transaction created.' });
	})
} satisfies Actions;
