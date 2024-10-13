import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { getTransaction, updateTransaction } from '$lib/server/transactions';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createServerTransactionFormSchema } from '../schema.server';
import { getCategories } from '$lib/server/categories';
import { getAccounts } from '$lib/server/accounts';

export const load: PageServerLoad = protectRoute(async ({ params }, user) => {
	const transaction = getTransaction(db, user.id, Number(params.id));

	if (!transaction) {
		error(404, 'Transaction not found');
	}

	return {
		form: await superValidate(
			{
				date: transaction.date,
				accountId: transaction.account?.id,
				categoryId: transaction.category?.id ?? null,
				flow: transaction.flow,
				validated: transaction.validated,
				description: transaction.description ?? undefined
			},
			zod(createServerTransactionFormSchema(db, user))
		),
		categories: getCategories(db, user.id),
		accounts: getAccounts(db, user.id)
	};
});

export const actions = {
	default: protectRoute(async ({ params, request, cookies }, user) => {
		const form = await superValidate(
			request,
			zod(createServerTransactionFormSchema(db, user))
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			updateTransaction(db, user.id, Number(params.id), {
				...form.data
			});
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
