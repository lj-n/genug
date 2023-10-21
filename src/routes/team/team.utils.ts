import { db } from '$lib/server';
import { schema } from '$lib/server/schema';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';

export async function createTeam(
	name: string,
	userId: string,
	description?: string
): Promise<number> {
	const team = await db.transaction(async (tx) => {
		const [newTeam] = await tx
			.insert(schema.team)
			.values({ name, description })
			.returning();

		await tx.insert(schema.teamMember).values({
			teamId: newTeam.id,
			userId,
			role: 'OWNER'
		});

		return newTeam;
	});

	return team.id;
}

/**
 * Prepared Statement:
 * Query a specific team and all its members.
 */
const getTeamQuery = db.query.team
	.findFirst({
		where: (team, { eq, sql }) => eq(team.id, sql.placeholder('id')),
		with: {
			member: {
				columns: { role: true },
				with: {
					user: {
						columns: { name: true, id: true }
					}
				}
			}
		}
	})
	.prepare();

export async function getTeam(id: number) {
	const team = await getTeamQuery.execute({ id });
	if (!team) throw new Error('Team not found');
	return team;
}

/**
 * Prepared Statement:
 * Searches all users in the database who match the search query
 * and are neither in the team nor the searching user.
 */
const lookupUsersNotInTeamQuery = db
	.select({ name: schema.user.name, id: schema.user.id })
	.from(schema.user)
	.leftJoin(schema.teamMember, eq(schema.teamMember.userId, schema.user.id))
	.where(
		and(
			or(
				eq(schema.user.id, sql.placeholder('search')),
				sql`lower(${schema.user.name}) like ${sql.placeholder('search')}`
			),
			or(
				isNull(schema.teamMember.teamId),
				ne(schema.teamMember.teamId, sql.placeholder('excludeTeamId'))
			),
			ne(schema.user.id, sql.placeholder('excludeUserId'))
		)
	)
	.prepare();

/**
 * Searches all users in the database who match the search query
 * and are neither in the team nor the searching user.
 */
export async function lookupUsersNotInTeam(
	/** Can be the user name or the user id */
	search: string,
	excludeUserId: string,
	excludeTeamId: number
) {
	return lookupUsersNotInTeamQuery.all({
		search,
		excludeUserId,
		excludeTeamId
	});
}

/**
 * Get the role of a team member. Returns `null` if user not found in team.
 */
export async function getTeamMemberRole(
	userId: string,
	teamId: number
): Promise<typeof schema.teamMember.$inferSelect.role | null> {
	const [foundMember] = await db
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId)
			)
		);

	if (!foundMember) {
		return null;
	}

	return foundMember.role;
}

export async function addTeamMember(
	userId: string,
	teamId: number,
	role: typeof schema.teamMember.$inferInsert.role = 'INVITED'
) {
	return await db.transaction(async (tx) => {
		const [foundUser] = await tx
			.select()
			.from(schema.user)
			.where(eq(schema.user.id, userId));

		if (!foundUser) {
			throw new Error('User not found');
		}

		await tx.insert(schema.teamMember).values({
			role,
			teamId,
			userId: foundUser.id
		});

		return foundUser;
	});
}

export async function setTeamMemberRole(
	userId: string,
	teamId: number,
	role: typeof schema.teamMember.$inferInsert.role
) {
	await db.transaction(async (tx) => {
		const [foundMember] = await tx
			.select()
			.from(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, userId),
					eq(schema.teamMember.teamId, teamId)
				)
			);

		if (!foundMember) throw new Error('Team member not found');

		await tx
			.update(schema.teamMember)
			.set({ role })
			.where(
				and(
					eq(schema.teamMember.userId, userId),
					eq(schema.teamMember.teamId, teamId)
				)
			);
	});
}

export async function confirmUserInvitation(userId: string, teamId: number) {
	await db.transaction(async (tx) => {
		const [invitedUser] = await tx
			.select()
			.from(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.teamId, teamId),
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
					eq(schema.teamMember.teamId, teamId),
					eq(schema.teamMember.userId, userId)
				)
			);
	});
}

export async function cancelUserInvitation(userId: string, teamId: number) {
	await db.transaction(async (tx) => {
		const [foundMember] = await tx
			.select()
			.from(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, userId),
					eq(schema.teamMember.teamId, teamId),
					eq(schema.teamMember.role, 'INVITED')
				)
			);

		if (!foundMember) throw new Error('Team member not found');

		await tx
			.delete(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, userId),
					eq(schema.teamMember.teamId, teamId)
				)
			);
	});
}


export async function removeTeamMember(userId: string, teamId: number) {
  await db.transaction(async (tx) => {
    const [foundMember] = await tx
      .select()
      .from(schema.teamMember)
      .where(
        and(
          eq(schema.teamMember.userId, userId),
          eq(schema.teamMember.teamId, teamId)
          // eq(schema.teamMember.role_id, 2) // only members can be removed
        )
      );

    if (!foundMember) throw new Error('Team member not found');

    await tx
      .delete(schema.teamMember)
      .where(
        and(
          eq(schema.teamMember.userId, userId),
          eq(schema.teamMember.teamId, teamId)
        )
      );
  });
}