import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getTeamRole, getTeams, protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = protectRoute(async (_, user) => {
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
	})
} satisfies Actions;
