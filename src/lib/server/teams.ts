import { and, eq, isNull, like, ne } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';

export function createTeam(
	database: Database,
	userId: string,
	name: string,
	description?: string
): typeof schema.team.$inferSelect {
	return database.transaction(() => {
		const team = database
			.insert(schema.team)
			.values({
				name,
				description
			})
			.returning()
			.get();

		database
			.insert(schema.teamMember)
			.values({
				teamId: team.id,
				userId,
				role: 'OWNER'
			})
			.returning()
			.get();

		return team;
	});
}

/**
 * Retrieves the role of a team member in a given team.
 * @returns The role of the user in the team or null if the user is not a member of the team.
 */
export function getTeamRole(
	database: Database,
	teamId: number,
	userId: string
): typeof schema.teamMember.$inferSelect.role | null {
	const teamMember = database
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId)
			)
		)
		.get();

	return teamMember?.role ?? null;
}

/**
 * Removes a team member from the database.
 * @throws If the user is the owner of the team or not found.
 */
export function removeTeamMember(
	database: Database,
	teamId: number,
	userId: string
): void {
	const member = database
		.delete(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'OWNER')
			)
		)
		.returning()
		.get();

	if (!member) {
		throw new Error(`Member is owner or not found in team(${teamId}).`);
	}
}

/**
 * Creates a team member.
 * @throws If the user is already a member of the team or the user/team does not exist.
 */
export function createTeamMember(
	database: Database,
	teamId: number,
	userId: string,
	role: typeof schema.teamMember.$inferInsert.role
): typeof schema.teamMember.$inferSelect {
	return database
		.insert(schema.teamMember)
		.values({ teamId, userId, role })
		.returning()
		.get();
}

/**
 * Sets the role of a team member in a given team.
 * @throws If the user is not a team member.
 */
export function updateTeamMemberRole(
	database: Database,
	teamId: number,
	userId: string,
	role: typeof schema.teamMember.$inferInsert.role
): void {
	const member = database
		.update(schema.teamMember)
		.set({ role })
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, role)
			)
		)
		.returning()
		.get();

	if (!member) {
		throw new Error(`Member not found in team(${teamId}).`);
	}
}

/**
 * Deletes a team from the database.
 * ATTENTION: This action is irreversible and also deletes all team specific data.
 * @throws If the team is not found.
 */
export function deleteTeam(database: Database, teamId: number): void {
	const team = database
		.delete(schema.team)
		.where(eq(schema.team.id, teamId))
		.returning()
		.get();

	if (!team) {
		throw new Error(`Team(${teamId}) not found.`);
	}
}

/** Retrieves a team and its members. */
export function getTeam(
	database: Database,
	teamId: number
):
	| (typeof schema.team.$inferSelect & {
			members: {
				role: typeof schema.teamMember.$inferSelect.role;
				user: Pick<typeof schema.user.$inferSelect, 'id' | 'name'>;
			}[];
	  })
	| undefined {
	return database.query.team
		.findFirst({
			where: (team, { eq }) => eq(team.id, teamId),
			with: {
				members: {
					columns: { role: true },
					with: { user: { columns: { id: true, name: true } } }
				}
			}
		})
		.sync();
}

/** Retrieves the teams that a user belongs to from the database. */
export function getTeams(
	database: Database,
	userId: string,
	withInvited = false
): {
	role: typeof schema.teamMember.$inferSelect.role;
	team: typeof schema.team.$inferSelect;
}[] {
	const where = withInvited
		? eq(schema.teamMember.userId, userId)
		: and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED')
			);

	return database.query.teamMember
		.findMany({
			where,
			columns: { role: true },
			with: { team: true }
		})
		.sync();
}

/** Looks up users by name, that are not team member in the given team. */
export function findUsersNotInTeam(
	database: Database,
	teamId: number,
	query: string
): Pick<typeof schema.user.$inferSelect, 'id' | 'name'>[] {
	const sq = database
		.select()
		.from(schema.teamMember)
		.where(eq(schema.teamMember.teamId, teamId))
		.as('sq');

	return database
		.select({ id: schema.user.id, name: schema.user.name })
		.from(schema.user)
		.leftJoin(sq, eq(schema.user.id, sq.userId))
		.where(and(like(schema.user.name, `%${query}%`), isNull(sq.userId)))
		.all();
}
