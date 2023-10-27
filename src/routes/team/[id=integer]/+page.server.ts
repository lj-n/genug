import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { db, withAuth } from '$lib/server';
import { schema } from '$lib/server/schema';
import {
	addTeamMember,
	cancelTeamInvitaion,
	confirmTeamInvitation,
	getTeam,
	getTeamMemberRole,
	lookupUsersNotInTeam,
	removeTeamMember,
	updateMemberRole
} from '$lib/server/teams';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const userRole = getTeamMemberRole(user.id, Number(params.id));
	if (!userRole) throw error(404, 'Team not found');

	return { userRole, team: getTeam(Number(params.id)) };
});

export const actions = {
	searchUser: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();

		const query = formData.get('query')?.toString();
		if (!query) return fail(400, { error: 'Missing search query.' });

		try {
			const foundUsers = lookupUsersNotInTeam(
				query,
				user.id,
				Number(params.id)
			);

			if (foundUsers.length === 0) {
				return fail(404, { error: 'No users found.' });
			}

			return { foundUsers };
		} catch (_e) {
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}
	}),

	inviteUser: withAuth(async ({ request, params }) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'Missing user id' });

		try {
			addTeamMember(userId, Number(params.id));

			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	acceptInvitation: withAuth(async ({ request, params }) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'Missing user id' });

		try {
			confirmTeamInvitation(userId, Number(params.id));
			return { success: true };
		} catch (_e) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	cancelInvitation: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'userId missing' });
		}

		try {
			cancelTeamInvitaion(userId, Number(params.id));
		} catch (error) {
			return fail(404, { error });
		}
		if (userId === user.id) {
			throw redirect(302, '/team');
		}

		return { success: true };
	}),

	removeMember: withAuth(async ({ params, request }, user) => {
		const userRole = getTeamMemberRole(user.id, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'userId missing' });

		try {
			removeTeamMember(userId, Number(params.id));

			return { success: true };
		} catch (error) {
			return fail(404, { error });
		}
	}),

	makeOwner: withAuth(async ({ params, request }, user) => {
		const userRole = getTeamMemberRole(user.id, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'userId missing' });

		try {
			updateMemberRole(userId, Number(params.id), 'OWNER');
			return { success: true };
		} catch (error) {
			return fail(404, { error });
		}
	}),

	deleteTeam: withAuth(async ({ params }, user) => {
		const userRole = getTeamMemberRole(user.id, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		try {
			db.delete(schema.team)
				.where(eq(schema.team.id, Number(params.id)))
				.returning()
				.get();
		} catch (error) {
			return fail(500, { error: 'Something went wrong sorry' });
		}

		throw redirect(302, '/team');
	})
} satisfies Actions;
