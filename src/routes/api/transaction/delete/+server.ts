import { actions } from '$db';
import { json, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const parsed = z
		.object({
			transactionIds: z
				.string()
				.array()
				.or(z.string())
				.transform((v) => (typeof v === 'string' ? [v] : v))
		})
		.safeParse(await request.json());

	if (!parsed.success) {
		return json({ error: `Invalid request` }, { status: 400 });
	}

	const { transactionIds } = parsed.data;

	const invalidId = transactionIds.some((id) => {
		return actions.transaction.getTransactionById({ id, userId: user.id }) === undefined;
	});

	if (invalidId) {
		return json({ error: 'Invalid transaction id' }, { status: 400 });
	}

	actions.transaction.batchDeleteTransactions({ ids: transactionIds, userId: user.id });

	return json({ success: true });
};
