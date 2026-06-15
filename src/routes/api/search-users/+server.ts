import { createUserCtx } from '$db/user-context';
import { json, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session) redirect(307, '/login');

	const parsed = z
		.object({
			budgetId: z.string().min(1),
			q: z.string().min(1)
		})
		.safeParse(Object.fromEntries(url.searchParams));

	if (!parsed.success) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const { budgetId, q } = parsed.data;
	const users = createUserCtx(locals.session.user.id).budget.eligibleUsers(budgetId);

	if (!users.find(({ name }) => name === q)) {
		return json({ error: 'Not Found' }, { status: 404 });
	}

	return json({ success: true });
};
