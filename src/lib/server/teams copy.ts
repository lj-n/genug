import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import type { InsertTeam, Team, SelectTeamMember } from './schema/tables';

export function createTeam(userId: string, teamDraft: InsertTeam): Team {
	return db.transaction(() => {
		const newTeam = db.insert(schema.team).values(teamDraft).returning().get();

		db.insert(schema.teamMember)
			.values({
				role: 'OWNER',
				userId,
				teamId: newTeam.id
			})
			.returning()
			.get();

		return newTeam;
	});
}

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

export function getTeam(id: number) {
	const team = getTeamQuery.get({ id });

	// const team = db
	// 	.select()
	// 	.from(schema.team)
	// 	.where(eq(schema.team.id, id))
	// 	.get();

	if (!team) {
		throw new Error('team not found.');
	}

	return team;
}

export function getTeams(userId: string): Team[] {
	return db
		.select({
			id: schema.team.id,
			name: schema.team.name,
			description: schema.team.description,
			createdAt: schema.team.createdAt
		})
		.from(schema.teamMember)
		.innerJoin(schema.team, eq(schema.team.id, schema.teamMember.teamId))
		.where(eq(schema.teamMember.userId, userId))
		.all();
}

export function getTeamMemberRole(
	userId: string,
	teamId: number
): SelectTeamMember['role'] {
	const foundMember = db
		.select()
		.from(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.teamId, teamId),
				eq(schema.teamMember.userId, userId)
			)
		)
		.get();

	if (!foundMember) {
		throw new Error('team member not found.');
	}

	return foundMember.role;
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
export function lookupUsersNotInTeam(
	/** Can be the user name or the user id */
	search: string,
	excludeUserId: string,
	excludeTeamId: number
): { name: string; id: string }[] {
	return lookupUsersNotInTeamQuery.all({
		search,
		excludeUserId,
		excludeTeamId
	});
}

export function addTeamMember(
	userId: string,
	teamId: number,
	role: SelectTeamMember['role'] = 'INVITED'
) {
	return db.transaction(() => {
		const foundUser = db
			.select()
			.from(schema.user)
			.where(eq(schema.user.id, userId))
			.get();

		if (!foundUser) {
			throw new Error('User not found');
		}

		const newTeamMember = db
			.insert(schema.teamMember)
			.values({
				role,
				teamId,
				userId: foundUser.id
			})
			.returning()
			.get();

		if (!newTeamMember) {
			throw new Error('Could not create team member');
		}

		return foundUser;
	});
}

export function updateMemberRole(
	userId: string,
	teamId: number,
	role: SelectTeamMember['role']
) {
	db.transaction(() => {
		const invitedUser = db
			.select()
			.from(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.teamId, teamId),
					eq(schema.teamMember.userId, userId),
					ne(schema.teamMember.role, role)
				)
			)
			.get();

		if (!invitedUser) throw new Error('No User found');

		const updatedTeamMember = db
			.update(schema.teamMember)
			.set({ role })
			.where(
				and(
					eq(schema.teamMember.teamId, teamId),
					eq(schema.teamMember.userId, userId)
				)
			)
			.returning()
			.get();

		if (!updatedTeamMember) {
			throw new Error('Could not update team member');
		}
	});
}

export function confirmTeamInvitation(userId: string, teamId: number) {
	updateMemberRole(userId, teamId, 'MEMBER');
}

export function cancelTeamInvitaion(userId: string, teamId: number) {
	db.transaction(() => {
		const invitedUser = db
			.select()
			.from(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, userId),
					eq(schema.teamMember.teamId, teamId),
					eq(schema.teamMember.role, 'INVITED')
				)
			)
			.get();

		if (!invitedUser) {
			throw new Error('Could not find invited team member');
		}

		removeTeamMember(userId, teamId);
	});
}

export function removeTeamMember(userId: string, teamId: number) {
	const removedMember = db
		.delete(schema.teamMember)
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				eq(schema.teamMember.teamId, teamId)
			)
		)
		.returning()
		.get();

	if (!removedMember) {
		throw new Error('Could not remove team member');
	}
}


