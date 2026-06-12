import { actions } from '$db';
import { entityOrderTypes } from '$db/tables';
import * as m from '$lib/paraglide/messages';
import { error, json, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

const reorderSchema = z
	.object({
		entity: z.enum(entityOrderTypes),
		orderedIds: z.array(z.string().min(1)).min(1)
	})
	.refine(({ orderedIds }) => new Set(orderedIds).size === orderedIds.length, {
		message: 'orderedIds must be unique',
		path: ['orderedIds']
	});

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.session) redirect(307, '/login');
	const { user } = locals.session;

	const rawBody = await request.json();
	const parsed = reorderSchema.safeParse(rawBody);

	if (!parsed.success) {
		return error(400, { message: m.error_invalid_request_body() });
	}

	try {
		switch (parsed.data.entity) {
			case 'account':
				actions.account.reorderAccounts({ orderedIds: parsed.data.orderedIds, userId: user.id });
				break;
			case 'budget':
				actions.budget.reorderBudgets({ orderedIds: parsed.data.orderedIds, userId: user.id });
				break;
			case 'category':
				actions.category.reorderCategories({ orderedIds: parsed.data.orderedIds, userId: user.id });
				break;
		}

		return json({ success: true });
	} catch (err) {
		locals.logger.error({ err }, 'failed to reorder entity');
		error(500, { message: m.error_unable_to_save_order() });
	}
};
