import { withPermissions } from '$db/actions';
import { schemaTransactionCreate } from '$lib/schemas/transactions';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions } from './$types';

export const actions = {
	default: withPermissions(async (user, actions, event) => {
		const form = await superValidate(event.request, zod4(schemaTransactionCreate));
		if (!form.valid) return fail(400, { form });

		const parsedData = form.data;

		try {
			const transaction = actions.transaction.create({
				budgetId: event.params.budgetId,
				createdBy: user.id,
				...parsedData
			});
			return message(form, { text: transaction.id, type: 'success' });
		} catch (_error) {
			console.log(_error);
			return message(form, { type: 'error' });
		}
	})
} satisfies Actions;
