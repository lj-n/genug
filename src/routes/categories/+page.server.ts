import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { protectRoute } from '$lib/server/auth';
import { getTeams, getTeamRole } from '$lib/server/teams';
import { db } from '$lib/server/db';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	console.log('CAT ROUTE')
	return { teams: getTeams(db, user.id) };
});

export const actions = {
	create: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();

		const parsed = zfd
			.formData({
				name: zfd.text(),
				description: zfd.text(z.string().optional()),
				teamId: zfd.numeric(z.number().int().positive().optional())
			})
			.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		const { name, description, teamId } = parsed.data;

		try {
			if (teamId) {
				const role = getTeamRole(db, teamId, user.id);
				if (role !== 'OWNER') throw new Error('Must be team owner');
			}

			const category = db
				.insert(schema.category)
				.values({
					userId: user.id,
					name,
					description,
					teamId
				})
				.returning()
				.get();

			return { success: true, category };
		} catch (error) {
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}
	}),

	saveOrder: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const requestSchema = zfd.formData({
			order: zfd.json(z.number().int().positive().array())
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { error: 'Invalid params' });
		}

		try {
			const { order } = parsed.data;

			const updated = db
				.update(schema.userSettings)
				.set({ categoryOrder: order })
				.where(eq(schema.userSettings.userId, user.id))
				.returning()
				.get();

			if (!updated) {
				return fail(403, { error: 'User settings not found' });
			}
		} catch (error) {
			return fail(500, { error: 'Something went wrong, sorry.' });
		}
	})
} satisfies Actions;
