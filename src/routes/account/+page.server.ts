import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { protectRoute } from '$lib/server/auth/utils';
import {
	createUserAccount,
	getUserAccountsWithBalance
} from '$lib/server/account';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { getTeamRole, getUserTeams } from '$lib/server/auth';
import { schema } from '$lib/server/schema';

export const load: PageServerLoad = protectRoute(async (_, { userId }) => {
	return {
		accounts: getUserAccountsWithBalance(db, userId),
		teams: db.query.teamMember
			.findMany({
				where: (member, { eq, and, ne }) => {
					return and(eq(member.userId, userId), ne(member.role, 'INVITED'));
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
				teamId: zfd.numeric(z.number().int().positive())
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
				if (role !== 'OWNER') throw new Error('Must be team owner');

				db.insert(schema.teamAccount).values({
					createdBy: user.id,
					name,
					description,
					teamId
				});
			} else {
				createUserAccount(db, { name, description, userId: user.id });
			}
		} catch (error) {
			return fail(500, {
				data: Object.fromEntries(formData),
				error: 'Something went wrong, sorry.'
			});
		}
	})
} satisfies Actions;
