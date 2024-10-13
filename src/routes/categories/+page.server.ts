import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const actions = {
	saveOrder: protectRoute(async ({ request }, user) => {
		const parsed = z
			.object({ order: z.coerce.number().array() })
			.safeParse(await request.json());

		if (!parsed.success) {
			return fail(400, { error: 'Invalid params' });
		}

		try {
			const updated = db
				.update(schema.userSettings)
				.set({ categoryOrder: parsed.data.order })
				.where(eq(schema.userSettings.userId, user.id))
				.returning()
				.get();

			if (!updated) {
				return fail(403, { error: 'User settings not found' });
			}
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, sorry.' });
		}
	})
} satisfies Actions;
