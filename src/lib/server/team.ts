import { schema, db } from '.';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';

export async function createTeam(
	name: string,
	creatorId: string,
	description?: string
): Promise<number> {
	const team = await db.transaction(async (tx) => {
		const [newTeam] = await tx
			.insert(schema.team)
			.values({ name, description })
			.returning();

		await tx.insert(schema.teamMember).values({
			teamId: newTeam.id,
			userId: creatorId,
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
						columns: {
							name: true,
							id: true
						}
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
		excludeTeamId,
		excludeUserId
	});
}

export async function addUserToTeam(
	userId: string,
	teamId: number,
	role: typeof schema.teamMember.$inferInsert.role = 'INVITED'
) {
	await db.insert(schema.teamMember).values({
		userId,
		teamId,
		role
	});
}

export async function setTeamMemberRole(
	userId: string,
	teamId: number,
	role: typeof schema.teamMember.$inferInsert.role
) {
	await db
		.update(schema.teamMember)
		.set({ role })
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				eq(schema.teamMember.teamId, teamId)
			)
		);
}


// export async function isTeamMember(userId: string, teamId: number) {

// }