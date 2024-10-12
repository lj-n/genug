import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { protectRoute } from '$lib/server/auth/utils';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { getTeamRole } from '$lib/server/teams';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return {
		teams: db.query.teamMember
			.findMany({
				where: (member, { eq, and, ne }) => {
					return and(eq(member.userId, user.id), ne(member.role, 'INVITED'));
				},
				columns: {},
				with: {
					team: {
						columns: {
							id: true,
							name: true
						}
					}
				}
			})
			.sync()
	};
});

export const actions = {
	create: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();

		const parsed = zfd
			.formData({
				name: zfd.text(),
				description: zfd.text(z.string().optional()),
				teamId: zfd.numeric(z.number().int().positive().optional())
			})
			.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		const { name, description, teamId } = parsed.data;

		try {
			if (teamId) {
				const role = getTeamRole(db, teamId, user.id);
				if (role !== 'OWNER') {
					return fail(403, { error: 'Must be team owner.' });
				}
			}

			const account = db
				.insert(schema.account)
				.values({
					userId: user.id,
					name,
					description,
					teamId
				})
				.returning()
				.get();

			return { success: true, account };
		} catch (error) {
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}
	})
} satisfies Actions;
