import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { protectRoute } from '$lib/server/auth';
import { getTeams, getTeamRole } from '$lib/server/teams';
import { db } from '$lib/server/db';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createCategoryFormSchema } from './schema';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		teams: getTeams(db, user.id),
		createForm: await superValidate(zod(createCategoryFormSchema))
	};
});

export const actions = {
	create: protectRoute(async ({ request }, user) => {
		const form = await superValidate(request, zod(createCategoryFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { name, description, teamId } = form.data;

		try {
			if (teamId) {
				const role = getTeamRole(db, teamId, user.id);
				if (role !== 'OWNER') {
					return message(
						form,
						{
							type: 'error',
							text: 'You do not have permission to create a category in this team.'
						},
						{ status: 403 }
					);
				}
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

			return message(form, {
				type: 'success',
				text: `Category ${category.name} created.`
			});
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
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
