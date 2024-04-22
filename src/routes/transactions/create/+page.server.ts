import { getAccounts } from '$lib/server/accounts';
import { protectRoute } from '$lib/server/auth';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import { zfd } from 'zod-form-data';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { fail, redirect } from '@sveltejs/kit';
import {
	TransactionNotAllowedError,
	checkIfTransactionIsAllowed
} from '$lib/server/transactions';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = protectRoute((_, user) => {
	return {
		categories: getCategories(db, user.id),
		accounts: getAccounts(db, user.id)
	};
});

export const actions = {
	default: protectRoute(async ({ request }, user) => {
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
			db.transaction(() => {
				const transaction = db
					.insert(schema.transaction)
					.values({
						...parsed.data,
						userId: user.id,
						validated: false
					})
					.returning()
					.get();

				checkIfTransactionIsAllowed(db, user.id, transaction);
			});
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
