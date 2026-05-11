import { withPermissions } from '$db/actions';
import { error } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './[transactionId=id]/$types';

import { schemaTransactionEdit } from './schema';

export const load: PageServerLoad = withPermissions(async (_user, actions, event) => {
	const transaction = actions.transaction.getById({ id: event.params.transactionId });

	if (!transaction) {
		error(404, 'Transaction not found');
	}

	return {
		title: 'Transactions',
		transaction
	};
});

export const actions = {
	edit: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event, zod4(schemaTransactionEdit));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { transactionId: id, ...update } = form.data;
		update.validated ??= false;

		actions.transaction.updateById({ id, update });

		return { success: true };

		// const currentTransaction = getTransaction(user.id, transactionId);

		// if (!currentTransaction) {
		// 	return error(404);
		// }
	})
} satisfies Actions;
