import { db, schema, withAuth } from '$lib/server';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq } from 'drizzle-orm';
import { createTeam } from './team.utils';

export const load: PageServerLoad = withAuth(async (_, user) => {
	// get the users teams
	const teams = await db
		.select({
			name: schema.team.name,
			id: schema.team.id,
			description: schema.team.description,
			createdAt: schema.team.createdAt
		})
		.from(schema.team)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.where(eq(schema.teamMember.userId, user.userId));

	return { user, teams };
});

export const actions = {
	createTeam: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Missing team name' });
		}

		let newTeamId: number;

		try {
			newTeamId = await createTeam(name, user.userId, description);
		} catch (error) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, please try again.'
			});
		}

		throw redirect(302, `/team/${newTeamId}`);
	})
} satisfies Actions;
