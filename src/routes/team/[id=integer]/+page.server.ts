import { db, schema, sendMail, withAuth } from '$lib/server';
import { and, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

import type { Actions, PageServerLoad } from './$types';
import { getTeamMemberRole, getTeam, lookupUsersNotInTeam } from './team.utils';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const teamId = Number(params.id);

	const userRole = await getTeamMemberRole(user.userId, teamId);

	if (!userRole) throw error(404, 'Team not found');

	const team = await getTeam(teamId);

	return { userRole, team };
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
				return fail(400, { error: 'No users found.' });
			}

			return { foundUsers };
		} catch (_e) {
			return fail(400, { error: 'No users found.' });
		}
	}),

	inviteUser: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(401, { error: 'Missing user id' });

		try {
			const invitedUser = await db.transaction(async (tx) => {
				const [foundUser] = await tx
					.select()
					.from(schema.user)
					.where(eq(schema.user.id, userId));

				if (!foundUser) {
					throw new Error('User not found');
				}

				await tx.insert(schema.teamMember).values({
					role: 'INVITED',
					teamId: Number(params.id),
					userId: foundUser.id
				});

				return foundUser;
			});

			const base = dev
				? 'http://localhost:5173'
				: 'https://genug-sveltekit.fly.dev';
			const url = new URL(`/team/${params.id}`, base);

			const html = `
				<p>Hi ${invitedUser.name} 👋,</p>
				<p>${user.name} invited you to a team</p>
				<a href="${url.href}">Click here to go to the team page</a>
			`;

			await sendMail({
				from: '"genug.app" <no-reply@genug.app>',
				to: invitedUser.email,
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

		if (!userId) return fail(401, { error: 'Missing user id' });

		try {
			await db.transaction(async (tx) => {
				const [invitedUser] = await tx
					.select()
					.from(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.teamId, Number(params.id)),
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.role, 'INVITED')
						)
					);

				if (!invitedUser) throw new Error('No User found');

				await tx
					.update(schema.teamMember)
					.set({ role: 'MEMBER' })
					.where(
						and(
							eq(schema.teamMember.teamId, Number(params.id)),
							eq(schema.teamMember.userId, userId)
						)
					);
			});

			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Invited user not found' });
		}
	}),

	cancelInvitation: withAuth(async ({ request, params }, user) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'userId missing' });
		}

		try {
			await db.transaction(async (tx) => {
				const [foundMember] = await tx
					.select()
					.from(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id)),
							eq(schema.teamMember.role, 'INVITED')
						)
					);

				if (!foundMember) throw new Error('Team member not found');

				await tx
					.delete(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id))
						)
					);
			});
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
			await db.transaction(async (tx) => {
				const [foundMember] = await tx
					.select()
					.from(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id))
							// eq(schema.teamMember.role_id, 2) // only members can be removed
						)
					);

				if (!foundMember) throw new Error('Team member not found');

				await tx
					.delete(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id))
						)
					);
			});

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
			await db.transaction(async (tx) => {
				const [foundMember] = await tx
					.select()
					.from(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id)),
							eq(schema.teamMember.role, 'MEMBER')
						)
					);

				if (!foundMember) throw new Error('Team member not found');

				await tx
					.update(schema.teamMember)
					.set({ role: 'OWNER' })
					.where(
						and(
							eq(schema.teamMember.userId, userId),
							eq(schema.teamMember.teamId, Number(params.id))
						)
					);
			});

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
