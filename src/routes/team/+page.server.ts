import { db, protectRoute, schema } from '$lib/server';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await protectRoute(locals);

	// get the users teams
	const teams = await db
		.select({
			name: schema.team.name,
			id: schema.team.id,
			description: schema.team.description,
			createdAt: schema.team.createdAt
		})
		.from(schema.team)
		.leftJoin(schema.teamMember, eq(schema.teamMember.team_id, schema.team.id))
		.where(eq(schema.teamMember.user_id, user.userId));

	return { user, teams };
};

export const actions = {
	async default({ locals, request }) {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString() || null;

		if (!name) return fail(400, { description, error: 'Missing name' });

		let newTeamId: number;

		try {
			newTeamId = await db.transaction(async (tx) => {
				const [team] = await tx
					.insert(schema.team)
					.values({ name, description })
					.returning();
				await tx.insert(schema.teamMember).values({
					team_id: team.id,
					user_id: session.user.userId,
					role_id: 1
				});

				return team.id;
			});
		} catch (error) {
			console.log('🛸 < file: +page.server.ts:28 < error =', error);
			return fail(500, { name, description, error: 'Something went wrong' });
		}

		throw redirect(302, `/team/${newTeamId}`);
	}
} satisfies Actions;
