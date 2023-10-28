import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { TeamRole } from '../schema/tables';

export class Team {
	readonly id: number;
	readonly name: string;
	readonly createdAt: string;
	readonly description: string | null;

	private userId: string;
	private role: TeamRole;

	// category: TeamCategory

	constructor(teamId: number, userId: string) {
		const member = teamByUserQuery.get({ userId, teamId });

		if (!member) {
			throw new Error(`User(${userId}) not part of team(${teamId}).`);
		}

		this.id = member.team.id;
		this.name = member.team.name;
		this.createdAt = member.team.createdAt;
		this.description = member.team.description;

		this.role = member.role;
		this.userId = userId;
	}

	invite(inviteeId: string) {
		if (this.role !== 'OWNER') {
			throw new Error('Only team owners can invite users.');
		}

		db.transaction(() => {
			const foundUser = userNotInTeamQuery.get({
				userId: inviteeId,
				teamId: this.id
			});

			if (!foundUser) {
				throw new Error('User not found or already part of team/invited.');
			}

			db.insert(schema.teamMember)
				.values({
					userId: inviteeId,
					teamId: this.id,
					role: 'INVITED'
				})
				.returning()
				.get();
		});
	}

	acceptInvite() {
		if (this.role !== 'INVITED') {
			throw new Error(
				`User(${this.userId}) is not invited. Role(${this.role})`
			);
		}

		this.setMemberRole(this.userId, 'MEMBER');
	}

	cancelInvite() {
		if (this.role !== 'INVITED') {
			throw new Error(
				`User(${this.userId}) is not invited. Role(${this.role})`
			);
		}

		this.removeMember(this.userId);
	}

	makeMemberOwner(memberId: string) {
		if (this.role !== 'OWNER') {
			throw new Error('Only team owners can promote team member.');
		}

		this.setMemberRole(memberId, 'OWNER');
	}

	removeMember(memberId: string) {
		if (memberId !== this.userId && this.role !== 'OWNER') {
			throw new Error(
				'You must be the team member to be removed or team owner'
			);
		}

		const removedMember = db
			.delete(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, memberId),
					eq(schema.teamMember.teamId, this.id)
				)
			)
			.returning()
			.get();

		if (!removedMember) {
			throw new Error(
				`Could not remove member(${memberId}) from team(${this.id}).`
			);
		}
	}

	getMembers() {
		const team = teamWithMembersQuery.get({ teamId: this.id });

		if (!team) {
			throw new Error(`Team(${this.id}) not found.`);
		}

		return team.members;
	}

	getSerializedInfo() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			createdAt: this.createdAt,
			role: this.role,
			members: this.getMembers()
		};
	}

	private setMemberRole(memberId: string, role: TeamRole) {
		db.transaction(() => {
			const member = teamMemberQuery.get({
				userId: memberId,
				teamId: this.id
			});

			if (!member) {
				throw new Error(`User(${memberId}) not part of team(${this.id}).`);
			}

			const updatedMember = db
				.update(schema.teamMember)
				.set({ role })
				.where(
					and(
						eq(schema.teamMember.userId, member.userId),
						eq(schema.teamMember.teamId, this.id)
					)
				)
				.returning()
				.get();

			if (updatedMember.userId === this.userId) {
				this.role = updatedMember.role;
			}
		});
	}
}

export class UserTeam {
	private userId: string;
	private teams: Team[];

	constructor(userId: string) {
		this.userId = userId;
		this.teams = teamMembersByUserQuery
			.all({ userId: this.userId })
			.map((member) => new Team(member.teamId, member.userId));
	}

	get(teamId: number): Team {
		return new Team(teamId, this.userId);
	}

	get all(): Team[] {
		return this.teams;
	}

	create({
		teamname,
		description
	}: {
		teamname: string;
		description?: string;
	}): Team {
		return db.transaction(() => {
			const team = db
				.insert(schema.team)
				.values({
					name: teamname,
					description
				})
				.returning()
				.get();

			db.insert(schema.teamMember)
				.values({
					role: 'OWNER',
					userId: this.userId,
					teamId: team.id
				})
				.returning()
				.get();

			return new Team(team.id, this.userId);
		});
	}
}

const teamByUserQuery = db.query.teamMember
	.findFirst({
		columns: { role: true },
		where: (teamMember, { and, eq, sql }) => {
			return and(
				eq(teamMember.teamId, sql.placeholder('teamId')),
				eq(teamMember.userId, sql.placeholder('userId'))
			);
		},
		with: {
			team: true
		}
	})
	.prepare();

const teamMemberQuery = db.query.teamMember
	.findFirst({
		where: (teamMember, { and, eq, sql }) => {
			return and(
				eq(teamMember.userId, sql.placeholder('userId')),
				eq(teamMember.teamId, sql.placeholder('teamId'))
			);
		}
	})
	.prepare();

const teamMembersByUserQuery = db.query.teamMember
	.findMany({
		where: (teamMember, { eq, sql }) => {
			return eq(teamMember.userId, sql.placeholder('userId'));
		}
	})
	.prepare();

const teamWithMembersQuery = db.query.team
	.findFirst({
		where: (team, { eq, sql }) => eq(team.id, sql.placeholder('teamId')),
		with: {
			members: {
				columns: {
					teamId: false,
					userId: false
				},
				with: {
					user: true
				}
			}
		}
	})
	.prepare();

const userNotInTeamQuery = db
	.select()
	.from(schema.user)
	.leftJoin(schema.teamMember, eq(schema.teamMember.userId, schema.user.id))
	.where(
		and(
			eq(schema.user.id, sql.placeholder('userId')),
			or(
				ne(schema.teamMember.teamId, sql.placeholder('teamId')),
				isNull(schema.teamMember.teamId)
			)
		)
	)
	.prepare();
