import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import {
	getTransaction,
	getTransactions,
	transactionFilterSchema,
	updateBulkTransactions
} from '$lib/server/transactions';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { validateFormSchema } from './schema';
import { schema } from '$lib/server/schema';
import { inArray } from 'drizzle-orm';
import { getCategories } from '$lib/server/categories';
import { getAccountsWithBalance } from '$lib/server/accounts';

export const load: PageServerLoad = protectRoute(async ({ url }, user) => {
	const filter = transactionFilterSchema.parse(url.searchParams);
	/**
	 * Todo: Write sql query to get total transaction count
	 */
	const filterCopy = { ...filter };
	filterCopy.limit = 0;
	const totalTransactionCount = getTransactions(db, user.id, filterCopy).length;
	return {
		filter,
		transactions: getTransactions(db, user.id, filter),
		categories: getCategories(db, user.id),
		accounts: getAccountsWithBalance(db, user.id),
		validateForm: await superValidate(zod(validateFormSchema)),
		totalTransactionCount
	};
});

export const actions = {
	default: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(validateFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { transactionIds } = form.data;

		try {
			if (formData.has('invalidate')) {
				const transactions = updateBulkTransactions(
					db,
					user.id,
					transactionIds,
					{
						validated: false
					}
				);
				return message(form, {
					type: 'success',
					text: `Updated ${transactions.length} ${transactions.length === 1 ? 'Transaction' : 'Transactions'}.`
				});
			}

			if (formData.has('delete')) {
				if (
					transactionIds.some(
						(id) => getTransaction(db, user.id, id) === undefined
					)
				) {
					throw new Error('Transaction not found.');
				}

				const removed = db
					.delete(schema.transaction)
					.where(inArray(schema.transaction.id, transactionIds))
					.returning()
					.all();

				return message(form, {
					type: 'success',
					text: `Deleted ${removed.length} ${removed.length === 1 ? 'Transaction' : 'Transactions'}.`
				});
			}

			const transactions = updateBulkTransactions(db, user.id, transactionIds, {
				validated: true
			});
			return message(form, {
				type: 'success',
				text: `Updated ${transactions.length} ${transactions.length === 1 ? 'Transaction' : 'Transactions'}.`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}
	})
} satisfies Actions;
