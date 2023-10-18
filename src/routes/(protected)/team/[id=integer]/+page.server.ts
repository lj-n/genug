import { db, schema, sendMail } from '$lib/server';
import { and, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';

const getTeamMembers = db
	.select({
		userId: schema.user.id,
		email: schema.user.email,
		name: schema.user.name,
		role: schema.teamMember.role
	})
	.from(schema.user)
	.leftJoin(schema.teamMember, eq(schema.teamMember.userId, schema.user.id))
	.where(eq(schema.teamMember.teamId, sql.placeholder('teamId')))
	.prepare();



export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	const teamId = parseInt(params.id);

	const [foundUser] = await db
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.userId, user.userId),
				eq(schema.teamMember.teamId, teamId)
			)
		);

	if (!foundUser) {
		throw error(404, 'Team not found');
	}

	const members = await getTeamMembers.all({ teamId });

	const role = members.find((member) => member.userId === user.userId)?.role;

	return { members, user: { role, ...user }, teamId };
};

export const actions = {
	usersearch: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const email = formData.get('email')?.toString();

		if (!email) return fail(400, { error: 'Missing email' });

		const [user] = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, email));

		if (!user) return fail(400, { error: 'User not found' });

		return { foundUser: user };
	},

	userinvite: async ({ locals, request, params }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

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
				<p>${session.user.name} invited you to a team</p>
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
	},

	userconfirm: async ({ locals, request, params }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401, { error: 'Unauthorized' });

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
	}
} satisfies Actions;
