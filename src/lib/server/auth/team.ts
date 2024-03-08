import { and, eq, ne } from 'drizzle-orm';
import type { Database } from '../db';
import { schema } from '../schema';

/**
 * Creates a new team in the database.
 *
 * @param database The database instance.
 * @param userId The ID of the user creating the team.
 * @param name The name of the team.
 * @param description The description of the team.
 * @returns The created team object.
 */
export function createTeam(
	database: Database,
	userId: string,
	name: string,
	description: string
) {
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
 *
 * @param database - The database instance.
 * @param teamId - The ID of the team.
 * @param userId - The ID of the user.
 * @returns The role of the team member, or null if the team member does not exist.
 */
export function getTeamRole(
	database: Database,
	teamId: number,
	userId: string
) {
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
 *
 * @param database The database instance.
 * @param teamId The ID of the team.
 * @param userId The ID of the user to be removed.
 * @throws Error If the member is an owner or not found in the team.
 */
export function removeTeamMember(
	database: Database,
	teamId: number,
	userId: string
) {
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
 * Invites a user to a team.
 *
 * @param database The database object.
 * @param teamId The ID of the team.
 * @param userId The ID of the user to be invited.
 * @returns A promise that resolves to the inserted team member.
 */
export function inviteUserToTeam(
	database: Database,
	teamId: number,
	userId: string
) {
	return database
		.insert(schema.teamMember)
		.values({ teamId, userId, role: 'INVITED' })
		.returning()
		.get();
}

/**
 * Accepts a team invitation for a user.
 *
 * @param database The database instance.
 * @param teamId The ID of the team.
 * @param userId The ID of the user.
 * @throws Throws an error if the member is not found or not invited to the team.
 */
export function acceptTeamInvitation(
	database: Database,
	teamId: number,
	userId: string
) {
	const member = database
		.update(schema.teamMember)
		.set({ role: 'MEMBER' })
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId),
				eq(schema.teamMember.role, 'INVITED')
			)
		)
		.returning()
		.get();

	if (!member) {
		throw new Error(`Member not invited to team(${teamId}).`);
	}
}

/**
 * Cancels a team invitation for a user.
 *
 * @param database The database instance.
 * @param teamId The ID of the team.
 * @param userId The ID of the user.
 * @throws Throws an error if the member is not found or not invited to the team.
 */
export function cancelTeamInvitation(
	database: Database,
	teamId: number,
	userId: string
) {
	const member = database
		.delete(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId),
				eq(schema.teamMember.role, 'INVITED')
			)
		)
		.returning()
		.get();

	if (!member) {
		throw new Error(`Member not invited to team(${teamId}).`);
	}
}

/**
 * Deletes a team from the database.
 * ATTENTION: This action is irreversible and also deletes all team specific data.
 *
 * @param database The database instance.
 * @param teamId The ID of the team to delete.
 * @throws Throws an error if the team is not found.
 */
export function deleteTeam(database: Database, teamId: number) {
	const team = database
		.delete(schema.team)
		.where(eq(schema.team.id, teamId))
		.returning()
		.get();

	if (!team) {
		throw new Error(`Team(${teamId}) not found.`);
	}
}

/**
 * Retrieves a team from the database based on the team ID.
 *
 * @param database The database instance.
 * @param teamId The ID of the team to retrieve.
 * @returns The team object, also includes member data.
 */
export function getTeam(database: Database, teamId: number) {
	return database.query.team
		.findFirst({
			where: (team, { eq }) => eq(team.id, teamId),
			with: {
				members: {
					columns: {
						role: true
					},
					with: {
						user: {
							columns: {
								id: true,
								name: true
							},
							with: {
								avatar: true
							}
						}
					}
				}
			}
		})
		.sync();
}
