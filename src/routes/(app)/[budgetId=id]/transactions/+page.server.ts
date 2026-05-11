import { withPermissions } from '$db/actions';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

import { schemaTransactionEdit } from './schema';

export const load: PageServerLoad = withPermissions(async (_user, _actions, _event) => {
	return { title: 'Transactions' };
});

export const actions = {
	default: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event, zod4(schemaTransactionEdit));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { transactionId: id, ...update } = form.data;
		update.validated ??= false;

		actions.transaction.updateById({ id, update });

		return message(form, { type: 'success' });

		// const currentTransaction = getTransaction(user.id, transactionId);

		// if (!currentTransaction) {
		// 	return error(404);
		// }
	})
} satisfies Actions;
