import { withPermissions } from '$db/actions';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = withPermissions(async (user, actions, event) => {
	const parsed = z
		.object({
			transactionIds: z
				.string()
				.array()
				.or(z.string())
				.transform((v) => (typeof v === 'string' ? [v] : v))
		})
		.safeParse(await event.request.json());

	if (!parsed.success) {
		return json({ error: `Invalid request` }, { status: 400 });
	}

	const { transactionIds } = parsed.data;

	const invalidId = transactionIds.some((id) => {
		return actions.transaction.getById({ id }) === undefined;
	});

	if (invalidId) {
		return json({ error: 'Invalid transaction id' }, { status: 400 });
	}

	actions.transaction.batchDelete({ ids: transactionIds });

	return json({ success: true });
});
