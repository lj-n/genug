import { db, schema } from '$lib/server';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';

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
