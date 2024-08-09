import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import {
	getTransactions,
	transactionFilterSchema,
	updateBulkTransactions
} from '$lib/server/transactions';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { validateFormSchema } from './schema';

export const load: PageServerLoad = protectRoute(async ({ url }, user) => {
	const filter = transactionFilterSchema.parse(url.searchParams);

    /**
     * Todo: Write sql query to get total transaction count
     */
    const filterCopy = { ...filter };
    filterCopy.limit = 0
    const totalTransactionCount = getTransactions(db, user.id, filterCopy).length;
	return {
		filter,
		transactions: getTransactions(db, user.id, filter),
		validateForm: await superValidate(zod(validateFormSchema)),
        totalTransactionCount
	};
});

export const actions = {
	validate: protectRoute(async ({ request }, user) => {
		const form = await superValidate(request, zod(validateFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { transactionIds, invalidate } = form.data;

		console.log(transactionIds, invalidate);

		try {
			const transactions = updateBulkTransactions(db, user.id, transactionIds, {
				validated: !invalidate
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
