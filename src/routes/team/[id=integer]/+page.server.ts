import { db, protectRoute, schema } from '$lib/server';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const getTeamMembers = db
	.select({
		email: schema.user.email,
		name: schema.user.name,
		role: schema.teamRole.type
	})
	.from(schema.user)
	.fullJoin(schema.teamMember, eq(schema.teamMember.user_id, schema.user.id))
	.fullJoin(schema.teamRole, eq(schema.teamMember.role_id, schema.teamRole.id))
	.where(eq(schema.teamMember.team_id, sql.placeholder('teamId')))
	.prepare();

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = await protectRoute(locals);
	const teamId = parseInt(params.id);

	const [foundUser] = await db
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.user_id, user.userId),
				eq(schema.teamMember.team_id, teamId)
			)
		);

	if (!foundUser) {
		throw error(404, 'Team not found');
	}

	const team = await getTeamMembers.all({ teamId });
	

	return { team };
};
