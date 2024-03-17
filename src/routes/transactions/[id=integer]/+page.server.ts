import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import {
	TransactionNotAllowedError,
	getTransaction,
	updateTransaction
} from '$lib/server/transactions';
import { getCategories } from '$lib/server/categories';
import { getAccounts } from '$lib/server/accounts';
import { zfd } from 'zod-form-data';

export const load: PageServerLoad = protectRoute(async ({ params }, user) => {
	const transaction = getTransaction(db, user.id, Number(params.id));

	if (!transaction) {
		error(404, 'Transaction not found');
	}

	return {
		transaction,
		categories: getCategories(db, user.id),
		accounts: getAccounts(db, user.id)
	};
});

export const actions = {
	edit: protectRoute(async ({ params, request }, user) => {
		const formData = await request.formData();

		const formDataSchema = zfd.formData({
			accountId: zfd.numeric(z.number().int().positive()),
			categoryId: zfd.numeric(
				z
					.number()
					.int()
					.positive()
					.optional()
					.transform((id) => id || null)
			),
			date: zfd.text(
				z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10))
			),
			description: zfd.text(z.string().optional()),
			flow: zfd.numeric(z.number().int())
		});

		const parsed = formDataSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid or missing parameters'
			});
		}

		try {
			updateTransaction(db, user.id, Number(params.id), parsed.data);
		} catch (error) {
			if (error instanceof TransactionNotAllowedError) {
				return fail(403, {
					data: Object.fromEntries(formData),
					error: error.message
				});
			}
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}

		redirect(302, '/transactions');
	})
} satisfies Actions;
