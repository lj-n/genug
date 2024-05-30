import { protectRoute, zodFindInDatabase } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getAccount, getAccounts } from '$lib/server/accounts';
import { db } from '$lib/server/db';
import { getCategories, getCategory } from '$lib/server/categories';
import type { PageServerLoad } from './$types';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import {
	TransactionNotAllowedError,
	checkIfTransactionIsAllowed
} from '$lib/server/transactions';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = protectRoute((_, user) => {
	return {
		accounts: getAccounts(db, user.id),
		categories: getCategories(db, user.id)
	};
});

export const actions = {
	default: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();

		const requestSchema = zfd.formData({
			fromAccount: zfd.numeric(
				z
					.number()
					.transform(
						zodFindInDatabase(db, user, getAccount, 'Account not found.')
					)
			),
			fromCategory: zfd.numeric(
				z
					.number()
					.transform(
						zodFindInDatabase(db, user, getCategory, 'Category not found.')
					)
					.optional()
			),
			fromDate: zfd.text(
				z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10))
			),
			toAccount: zfd.numeric(
				z
					.number()
					.transform(
						zodFindInDatabase(db, user, getAccount, 'Account not found.')
					)
			),
			toCategory: zfd.numeric(
				z
					.number()
					.transform(
						zodFindInDatabase(db, user, getCategory, 'Category not found.')
					)
					.optional()
			),
			toDate: zfd.text(
				z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10))
			),
			amount: zfd.numeric(z.number().int().positive())
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid or missing parameters'
			});
		}

		try {
			db.transaction(() => {
				let transaction = db
					.insert(schema.transaction)
					.values({
						userId: user.id,
						accountId: parsed.data.fromAccount.id,
						categoryId: parsed.data.fromCategory?.id || null,
						date: parsed.data.fromDate,
						description:
							`Transfered to Account "${parsed.data.toAccount.name}"` +
							(parsed.data.toCategory
								? `\nand Category "${parsed.data.toCategory?.name}"`
								: ''),
						flow: -parsed.data.amount,
						validated: false
					})
					.returning()
					.get();
				checkIfTransactionIsAllowed(db, user.id, transaction);

				transaction = db
					.insert(schema.transaction)
					.values({
						userId: user.id,
						accountId: parsed.data.toAccount.id,
						categoryId: parsed.data.toCategory?.id || null,
						date: parsed.data.toDate,
						description:
							`Transfered from Account "${parsed.data.fromAccount.name}"` +
							(parsed.data.toCategory
								? `\nand Category "${parsed.data.fromCategory?.name}"`
								: ''),
						flow: parsed.data.amount,
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
};
