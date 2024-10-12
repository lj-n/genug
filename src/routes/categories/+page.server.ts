import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { protectRoute } from '$lib/server/auth';
import { getTeam, getTeams } from '$lib/server/teams';
import { db } from '$lib/server/db';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createCategoryFormSchema } from './create/schema';
import { getCategories } from '$lib/server/categories';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		categories: getCategories(db, user.id),
		teams: getTeams(db, user.id)
			.map(({ team }) => getTeam(db, team.id))
			.filter((team) => team !== undefined),
		createForm: await superValidate(zod(createCategoryFormSchema))
	};
});

export const actions = {
	saveOrder: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const requestSchema = zfd.formData({
			order: zfd.json(z.number().int().positive().array())
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			console.log(parsed.error);
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
