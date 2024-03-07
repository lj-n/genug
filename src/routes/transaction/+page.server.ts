import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { schema } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { SQL } from 'drizzle-orm';
import {
	createUserTransaction,
	deleteUserTransaction,
	updateUserTransaction
} from '$lib/server/transaction';

export const load: PageServerLoad = protectRoute(({ url }, { userId }) => {
	const { searchParams } = url;

	const limit = Number(searchParams.get('limit')) || 30;
	const offset = Number(searchParams.get('offset')) || 0;
	const page = Number(searchParams.get('page')) || 1;
	const accounts = searchParams.getAll('a').map((q) => Number(q));
	const categories = searchParams.getAll('c').map((q) => Number(q));

	const transactions = db.query.userTransaction
		.findMany({
			where: (transaction, { and, eq, inArray }) => {
				const filter: SQL[] = [eq(transaction.userId, userId)];

				if (accounts.length) {
					filter.push(inArray(transaction.accountId, accounts));
				}
				if (categories.length) {
					filter.push(inArray(transaction.categoryId, categories));
				}

				return and(...filter);
			},
			orderBy: (transaction, { asc, desc }) => [
				asc(transaction.validated),
				desc(transaction.date),
				desc(transaction.createdAt)
			],
			limit,
			offset: (page - 1) * limit,
			with: {
				account: true,
				category: true
			}
		})
		.sync();

	return {
		limit,
		offset,
		page,
		transactions
	};
});

export const actions = {
	create: protectRoute(async ({ request }, { userId }) => {
		const formData = Object.fromEntries((await request.formData()).entries());
		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				...formData,
				createError: 'Please provide valid values.'
			});
		}

		try {
			createUserTransaction(db, {
				userId,
				...parsed.data
			});
		} catch (err) {
			return fail(500, { createError: 'Oops, something went wrong.' });
		}
		redirect(302, '/transaction');
	}),

	validate: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const transactionId = formData.get('id')?.toString();
		const validated = formData.get('validated')?.toString();

		if (!transactionId) {
			return fail(400, { validateError: 'Missing transaction id.' });
		}

		try {
			const transaction = updateUserTransaction(
				db,
				userId,
				Number(transactionId),
				{
					validated: validated === 'true'
				}
			);
			return { success: true, transaction };
		} catch {
			return fail(500, { validateError: 'Oops, something went wrong.' });
		}
	}),

	remove: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const transactionId = formData.get('id')?.toString();

		if (!transactionId) {
			return fail(400, { removeError: 'Missing transaction id.' });
		}

		try {
			const transaction = deleteUserTransaction(
				db,
				userId,
				Number(transactionId)
			);
			return { success: true, transaction };
		} catch {
			return fail(500, { removeError: 'Oops, something went wrong.' });
		}
	})
} satisfies Actions;

const requestSchema = createInsertSchema(schema.userTransaction, {
	accountId: z.coerce.number().int(),
	categoryId: z.coerce
		.number()
		.int()
		.transform((c) => c || null),
	date: z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10)),
	flow: z.coerce.number().int(),
	validated: z.coerce.boolean()
}).omit({ userId: true, id: true, createdAt: true });
