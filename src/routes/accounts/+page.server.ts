import { getAccountsWithBalance } from '$lib/server/accounts';
import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { removeThenAppendNewSortedIdsToArray } from '$lib/components/sort.utils';

export const load: PageServerLoad = protectRoute((_, user) => {
	return {
		accounts: getAccountsWithBalance(db, user.id)
	};
});

export const actions = {
	saveOrder: protectRoute(async ({ request }, user) => {
		const parsed = z
			.object({ order: z.coerce.number().array() })
			.safeParse(await request.json());

		if (!parsed.success) {
			return fail(400, { error: 'Invalid params' });
		}

		try {
			const updated = db.transaction(() => {
				const currentSettings = db
					.select()
					.from(schema.userSettings)
					.where(eq(schema.userSettings.userId, user.id))
					.get();

				let newOrder = parsed.data.order;

				if (currentSettings?.accountOrder) {
					newOrder = removeThenAppendNewSortedIdsToArray(
						currentSettings.accountOrder,
						newOrder
					);
				}

				return db
					.update(schema.userSettings)
					.set({ accountOrder: newOrder })
					.where(eq(schema.userSettings.userId, user.id))
					.returning()
					.get();
			});

			if (!updated) {
				return fail(403, { error: 'User settings not found' });
			}
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, sorry.' });
		}
	})
} satisfies Actions;
