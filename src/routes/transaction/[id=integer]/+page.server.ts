import { withAuth } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const transaction = user.transaction.get(Number(params.id));

	if (!transaction) {
		throw error(404, 'Transaction not found');
	}

	return {
		transaction,
		categories: user.category.getAll(),
		accounts: user.account.getAll()
	};
});

export const actions = {
	default: withAuth(async ({ params, request }, user) => {
		const formData = Object.fromEntries((await request.formData()).entries());
		const parsed = updateSchema.safeParse(formData);

		if (!parsed.success) {
      console.log(parsed.error)
			return fail(400, {
				...formData,
				error: 'Please provide valid values.'
			});
		}

		try {
			user.transaction.update(Number(params.id), parsed.data);
		} catch (er) {
			console.log('🛸 < file: +page.server.ts:53 < er =', er);
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
