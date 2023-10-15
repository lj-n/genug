import { db, schema } from '$lib/server';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { getTeamMembers, getTeamOwner } from '$lib/server/prepared';

export const load: PageServerLoad = async ({ parent, params }) => {
	// check if user is team owner
	const { user } = await parent();
	const teamId = params.id;

	const [foundOwner] = await db
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.team_id, Number(teamId)),
				eq(schema.teamMember.user_id, user.userId),
				eq(schema.teamMember.role_id, 1)
			)
		);

	if (!foundOwner) {
		throw error(400, 'Unauthorized');
	}

	return { teamMembers: getTeamMembers.all({ teamId }) };
};

export const actions = {
	cancelInvitation: async ({ params, locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const ownerId = session.user.userId;
		const isOwner = await getTeamOwner.get({
			userId: ownerId,
			teamId: params.id
		});
		if (!isOwner) return fail(401, { error: 'Unauthorized role' });

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
							eq(schema.teamMember.user_id, userId),
							eq(schema.teamMember.team_id, Number(params.id)),
							eq(schema.teamMember.role_id, 3)
						)
					);
				if (!foundMember) throw new Error('Invited team member not found');

				await tx
					.delete(schema.teamMember)
					.where(
						and(
							eq(schema.teamMember.user_id, userId),
							eq(schema.teamMember.team_id, Number(params.id))
						)
					);
			});

			return { success: true };
		} catch (error) {
			return fail(404, { error });
		}
	}
} satisfies Actions;
