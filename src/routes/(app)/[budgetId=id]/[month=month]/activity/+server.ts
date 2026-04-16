import { withPermissions } from '$db/actions';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

const reorderSchema = z.object({
	categoryId: z.string()
});

export const POST: RequestHandler = withPermissions(
	async (_user, actions, { locals, params, request }) => {
		const session = locals.session;

		if (!session) {
			error(401, 'Unauthorized');
		}

		const rawBody = await request.json();
		const parsed = reorderSchema.safeParse(rawBody);

		if (!parsed.success) {
			return error(400, 'Invalid request body');
		}

		const { categoryId } = parsed.data;

		try {
			const { month } = params;

			const activity = actions.category.monthActivity({ categoryId, month });

			return json(activity);
		} catch {
			error(400, 'Unable to get activity');
		}
	}
);
