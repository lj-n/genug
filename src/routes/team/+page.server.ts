import { db, withAuth } from '$lib/server';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq } from 'drizzle-orm';
import { schema } from '$lib/server/schema';
import { createTeam } from '$lib/server/teams';
import type { Team } from '$lib/server/schema/tables';

export const load: PageServerLoad = withAuth(async (_, user) => {
	// get the users teams
	const teams = db
		.select({
			name: schema.team.name,
			id: schema.team.id,
			description: schema.team.description,
			createdAt: schema.team.createdAt
		})
		.from(schema.team)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.where(eq(schema.teamMember.userId, user.id))
		.all();

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

		let newTeam: Team;

		try {
			newTeam = createTeam(user.id, { name, description });
		} catch (error) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, please try again.'
			});
		}

		throw redirect(302, `/team/${newTeam.id}`);
	})
} satisfies Actions;
