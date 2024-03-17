import { getAccountsWithBalance } from '$lib/server/accounts';
import { protectRoute } from '$lib/server/auth';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import {
	getTransaction,
	getTransactions,
	transactionFilterSchema,
	updateTransaction
} from '$lib/server/transactions';
import { zfd } from 'zod-form-data';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { fail } from '@sveltejs/kit';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getTeams } from '$lib/server/teams';

export const load: PageServerLoad = protectRoute(({ url }, user) => {
	const filter = transactionFilterSchema.parse(url.searchParams);

	return {
		filter,
		transactions: getTransactions(db, user.id, filter),
		accounts: getAccountsWithBalance(db, user.id),
		categories: getCategories(db, user.id),
		teams: getTeams(db, user.id)
	};
});

export const actions = {
	validate: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();

		const parsed = zfd
			.formData({
				validated: zfd.text(z.boolean()),
				id: zfd.numeric(z.number().int().positive())
			})
			.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		try {
			const { validated, id } = parsed.data;
			const transaction = updateTransaction(db, user.id, id, { validated });
			return { success: true, transaction };
		} catch (error) {
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}
	}),

	remove: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const parsed = zfd
			.formData({
				id: zfd.numeric(z.number().int().positive())
			})
			.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		try {
			const transaction = db.transaction(() => {
				const transaction = getTransaction(db, user.id, parsed.data.id);

				if (!transaction) throw new Error('Transaction not found');

				return db
					.delete(schema.transaction)
					.where(eq(schema.transaction.id, parsed.data.id))
					.returning()
					.get();
			});
			return { success: true, transaction };
		} catch (error) {
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}
	})
} satisfies Actions;
