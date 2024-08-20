import { protectRoute } from '$lib/server/auth';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { getAccounts } from '$lib/server/accounts';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import { createServerTransactionFormSchema } from '../schema.server';
import { schema } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		form: await superValidate(zod(createServerTransactionFormSchema(db, user))),
		categories: getCategories(db, user.id),
		accounts: getAccounts(db, user.id)
	};
});

export const actions = {
	default: protectRoute(async ({ request, cookies }, user) => {
		const form = await superValidate(
			request,
			zod(createServerTransactionFormSchema(db, user))
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			db.insert(schema.transaction)
				.values({
					userId: user.id,
					...form.data
				})
				.returning()
				.get();
		} catch {
			return message(form, {
				type: 'error',
				text: 'Failed to create transaction.'
			});
		}

		if (cookies.get('shallowRoute')) {
			redirect(302, cookies.get('shallowRoute')!);
		}
	})
} satisfies Actions;
