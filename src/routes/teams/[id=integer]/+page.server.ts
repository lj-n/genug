import {
	acceptTeamInvitation,
	cancelTeamInvitation,
	getTeam,
	getTeamRole,
	inviteUserToTeam,
	protectRoute
} from '$lib/server/auth';
import { db, type Database } from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { schema } from '$lib/server/schema';
import { and, eq, isNull, like } from 'drizzle-orm';

export const load: PageServerLoad = protectRoute(({ params, url }, user) => {
	const role = getTeamRole(db, Number(params.id), user.id);

	if (!role) {
		error(404, 'Team not found');
	}

	const team = getTeam(db, Number(params.id));

	if (!team) {
		error(404, 'Team not found');
	}

	const searchQuery = url.searchParams.get('query');

	if (searchQuery) {
		const searchResult = searchUsersNotInTeam(
			db,
			Number(params.id),
			searchQuery
		);
		return { team, role, searchResult, query: searchQuery };
	}

	return { team, role };
});

export const actions: Actions = {
	update: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		const teamId = Number(params.id);

		const role = getTeamRole(db, teamId, user.id);

		if (!role || role !== 'OWNER') {
			return fail(403, { error: 'You are not allowed to update this team' });
		}

		try {
			db.update(schema.team)
				.set({ name, description })
				.where(eq(schema.team.id, teamId));
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	invite: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		const teamId = Number(params.id);

		const role = getTeamRole(db, teamId, user.id);

		if (!role || role !== 'OWNER') {
			return fail(403, { error: 'You are not allowed to invite users' });
		}

		try {
			inviteUserToTeam(db, teamId, userId);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	accept: protectRoute(async ({ params }, user) => {
		try {
			acceptTeamInvitation(db, Number(params.id), user.id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	decline: protectRoute(async ({ params }, user) => {
		try {
			cancelTeamInvitation(db, Number(params.id), user.id);
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
		redirect(302, '/teams');
	})
};

function searchUsersNotInTeam(
	database: Database,
	teamId: number,
	query: string
) {
	const sq = database
		.select()
		.from(schema.teamMember)
		.where(eq(schema.teamMember.teamId, teamId))
		.as('sq');

	return database
		.select({ id: schema.user.id, name: schema.user.name })
		.from(schema.user)
		.leftJoin(sq, eq(schema.user.id, sq.userId))
		.where(and(like(schema.user.name, `%${query}%`), isNull(sq.userId)))
		.all();
}
