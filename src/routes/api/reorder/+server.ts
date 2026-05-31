import { withPermissions } from '$db/actions';
import { entityOrderTypes } from '$db/tables';
import * as m from '$lib/paraglide/messages';
import { error, json } from '@sveltejs/kit';
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

export const POST: RequestHandler = withPermissions(async (_user, actions, { locals, request }) => {
	const session = locals.session;

	if (!session) {
		error(401, { message: m.error_unauthorized() });
	}

	const rawBody = await request.json();
	const parsed = reorderSchema.safeParse(rawBody);

	if (!parsed.success) {
		return error(400, { message: m.error_invalid_request_body() });
	}

	try {
		switch (parsed.data.entity) {
			case 'account':
				actions.account.reorder({ orderedIds: parsed.data.orderedIds });
				break;
			case 'budget':
				actions.budget.reorder({ orderedIds: parsed.data.orderedIds });
				break;
			case 'category':
				actions.category.reorder({ orderedIds: parsed.data.orderedIds });
				break;
		}

		return json({ success: true });
	} catch (err) {
		locals.logger.error({ err }, 'failed to reorder entity');
		error(500, { message: m.error_unable_to_save_order() });
	}
});
