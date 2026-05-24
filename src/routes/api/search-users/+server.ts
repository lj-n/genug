import { withPermissions } from '$db/actions';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = withPermissions(async (user, actions, event) => {
	const parsed = z
		.object({
			budgetId: z.string().min(1),
			q: z.string().min(1)
		})
		.safeParse(Object.fromEntries(event.url.searchParams));

	if (!parsed.success) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const { budgetId, q } = parsed.data;
	const users = actions.budget.eligibleUsers({ budgetId });

	if (!users.find(({ name }) => name === q)) {
		return json({ error: 'Not Found' }, { status: 404 });
	}

	return json({ success: true });
});
