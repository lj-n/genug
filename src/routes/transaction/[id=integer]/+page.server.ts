import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { protectRoute } from '$lib/server/auth';
import {
	getUserTransaction,
	updateUserTransaction
} from '$lib/server/transaction';
import { getUserCategories } from '$lib/server/category';
import { getUserAccounts } from '$lib/server/account';
import { db } from '$lib/server/db';

export const load: PageServerLoad = protectRoute(
	async ({ params }, { userId }) => {
		const transaction = getUserTransaction(db, userId, Number(params.id));

		if (!transaction) {
			throw error(404, 'Transaction not found');
		}

		return {
			transaction,
			categories: getUserCategories(db, userId),
			accounts: getUserAccounts(db, userId)
		};
	}
);

export const actions = {
	default: protectRoute(async ({ params, request }, { userId }) => {
		const formData = Object.fromEntries((await request.formData()).entries());
		const parsed = updateSchema.safeParse(formData);

		if (!parsed.success) {
			console.log(parsed.error);
			return fail(400, {
				...formData,
				error: 'Please provide valid values.'
			});
		}

		try {
			updateUserTransaction(db, userId, Number(params.id), parsed.data);
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		throw redirect(307, '/transaction');
	})
} satisfies Actions;

const updateSchema = z.object({
	accountId: z.coerce.number().int(),
	categoryId: z.coerce
		.number()
		.int()
		.transform((c) => c || null),
	date: z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10)),
	flow: z.coerce.number().int(),
	validated: z.coerce.boolean()
});
