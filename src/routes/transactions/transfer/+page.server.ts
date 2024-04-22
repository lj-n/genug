import type { Actions, PageServerLoad } from './$types'
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { getCategories, getCategory } from '$lib/server/categories';
import { getAccount, getAccounts } from '$lib/server/accounts';
import { fail, redirect } from '@sveltejs/kit';
import { schema } from '$lib/server/schema';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

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
			fromAccountId: zfd.numeric(z.number().int().positive()),
			toAccountId: zfd.numeric(z.number().int().positive()),
			fromCategoryId: zfd.numeric(
				z
					.number()
					.int()
					.positive()
					.optional()
					.transform((id) => id || null)
			),
			toCategoryId: zfd.numeric(
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
			flow: zfd.numeric(z.number().int())
		});

		const parsed = formDataSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { error: 'Invalid params' });
		}

		try {
			/** Check if categories and accounts match */
			db.transaction(() => {
				const fromAccount = getAccount(db, user.id, parsed.data.fromAccountId);
				const toAccount = getAccount(db, user.id, parsed.data.toAccountId);

				if (!fromAccount || !toAccount) {
					return fail(404, { error: 'One or more accounts not found.' });
				}

				let fromCategory: ReturnType<typeof getCategory> = null;
				let toCategory: ReturnType<typeof getCategory> = null;

				if (parsed.data.fromCategoryId) {
					fromCategory = getCategory(db, user.id, parsed.data.fromCategoryId);
					if (!fromCategory) {
						throw new Error('From category not found.');
					}
					if (fromCategory.teamId !== fromAccount.teamId) {
						throw new Error('From category and from account do not match.');
					}
				}

				if (parsed.data.toCategoryId) {
					toCategory = getCategory(db, user.id, parsed.data.toCategoryId);
					if (!toCategory) {
						throw new Error('To category not found.');
					}
					if (toCategory.teamId !== toAccount.teamId) {
						throw new Error('To category and to account do not match.');
					}
				}
				db.insert(schema.transaction)
					.values({
						userId: user.id,
						accountId: fromAccount.id,
						categoryId: fromCategory?.id,
						validated: false,
						flow: -Math.abs(parsed.data.flow),
						date: parsed.data.date,
						description: `Transfer to account: ${toAccount.name}`
					})
					.run();

				db.insert(schema.transaction)
					.values({
						userId: user.id,
						accountId: toAccount.id,
						categoryId: toCategory?.id,
						validated: false,
						flow: Math.abs(parsed.data.flow),
						date: parsed.data.date,
						description: `Transfer from account: ${fromAccount.name}`
					})
					.run();
			});
		} catch (error) {
			console.log(error);
			return fail(500, { error: 'Something went wrong, sorry' });
		}

		redirect(302, '/transactions');
	})
} satisfies Actions
