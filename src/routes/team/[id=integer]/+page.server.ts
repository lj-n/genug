import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db, sendMail, withAuth } from '$lib/server';
import {
	getTeamMemberRole,
	getTeam,
	lookupUsersNotInTeam,
	setTeamMemberRole,
	addTeamMember,
	confirmUserInvitation,
	cancelUserInvitation,
	removeTeamMember
} from '../team.utils';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const userRole = await getTeamMemberRole(user.userId, Number(params.id));
	if (!userRole) throw error(404, 'Team not found');

	return { userRole, team: getTeam(Number(params.id)) };
});

export const actions = {
	searchUser: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();

		const query = formData.get('query')?.toString();
		if (!query) return fail(400, { error: 'Missing search query.' });

		try {
			const foundUsers = await lookupUsersNotInTeam(
				query,
				user.userId,
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

	inviteUser: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'Missing user id' });

		try {
			const invitedMember = await addTeamMember(userId, Number(params.id));

			const base = dev
				? 'http://localhost:5173'
				: 'https://genug-sveltekit.fly.dev';
			const url = new URL(`/team/${params.id}`, base);

			const html = `
				<p>Hi ${invitedMember.name} 👋,</p>
				<p>${user.name} invited you to a team</p>
				<a href="${url.href}">Click here to go to the team page</a>
			`;

			await sendMail({
				from: '"genug.app" <no-reply@genug.app>',
				to: invitedMember.email,
				subject: 'You got invited to join a team',
				html
			});

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
			await confirmUserInvitation(userId, Number(params.id));
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
			await cancelUserInvitation(userId, Number(params.id));
		} catch (error) {
			return fail(404, { error });
		}
		if (userId === user.userId) {
			throw redirect(302, '/team');
		}

		return { success: true };
	}),

	removeMember: withAuth(async ({ params, request }, user) => {
		const userRole = await getTeamMemberRole(user.userId, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'userId missing' });

		try {
			await removeTeamMember(userId, Number(params.id));

			return { success: true };
		} catch (error) {
			return fail(404, { error });
		}
	}),

	makeOwner: withAuth(async ({ params, request }, user) => {
		const userRole = await getTeamMemberRole(user.userId, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'userId missing' });

		try {
			await setTeamMemberRole(userId, Number(params.id), 'OWNER');
			return { success: true };
		} catch (error) {
			return fail(404, { error });
		}
	}),

	deleteTeam: withAuth(async ({ params }, user) => {
		const userRole = await getTeamMemberRole(user.userId, Number(params.id));
		if (userRole !== 'OWNER') return fail(401, { error: 'Unauthorized' });

		try {
			await db.delete(schema.team).where(eq(schema.team.id, Number(params.id)));
		} catch (error) {
			return fail(500, { error: 'Something went wrong sorry' });
		}

		throw redirect(302, '/team');
	})
} satisfies Actions;
