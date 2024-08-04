import { protectRoute } from '$lib/server/auth';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { createCategoryFormSchema } from './schema';
import { getTeam, getTeamRole, getTeams } from '$lib/server/teams';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		teams: getTeams(db, user.id)
			.map(({ team }) => getTeam(db, team.id))
			.filter((team) => team !== undefined),
		form: await superValidate(zod(createCategoryFormSchema)),
		initialTeamSelect: Number(null)
	};
});

export const actions = {
	default: protectRoute(async ({ request, cookies }, user) => {
		const form = await superValidate(request, zod(createCategoryFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { categoryName, categoryDescription, teamId } = form.data;

		let category: typeof schema.category.$inferSelect;
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

			category = db
				.insert(schema.category)
				.values({
					userId: user.id,
					name: categoryName,
					description: categoryDescription,
					teamId
				})
				.returning()
				.get();
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

		if (cookies.get('shallowRoute')) {
			redirect(302, cookies.get('shallowRoute')!);
		}

		redirect(302, `/categories/${category.id}`);
	})
} satisfies Actions;
