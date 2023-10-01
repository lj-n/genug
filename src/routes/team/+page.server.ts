import { db, protectRoute, schema } from '$lib/server';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await protectRoute(locals);
	return { user };
};

export const actions = {
	async default({ locals, request }) {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) return fail(400, { description, error: 'Missing name' });

		let newTeamId: number;

		try {
			newTeamId = await db.transaction(async (tx) => {
				const [team] = await tx
					.insert(schema.team)
					.values({ name })
					.returning();
				await tx
					.insert(schema.teamMember)
					.values({ team_id: team.id, user_id: session.user.userId });

				return team.id;
			});
		} catch (error) {
			console.log('🛸 < file: +page.server.ts:28 < error =', error);
			return fail(500, { name, description, error: 'Something went wrong' });
		}

		throw redirect(302, `/team/${newTeamId}`);
	}
} satisfies Actions;
