import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import type { TeamRole } from './schema/tables';

export class Team {
	teamId: number;
	userId: string;

	constructor(teamId: number, userId: string) {
		const member = teamMemberQuery.get({ userId, teamId });

		if (!member) {
			throw new Error(`User(${userId}) not part of team(${teamId}).`);
		}

		this.teamId = member.teamId;
		this.userId = member.userId;
	}

	get info() {
		const team = teamWithMembersQuery.get({ teamId: this.teamId });

		if (!team) {
			throw new Error(`Team(${this.teamId}) not found.`);
		}

		return {
			name: team.name,
			description: team.description,
			createdAt: team.createdAt
		};
	}

	get role() {
		const member = teamMemberQuery.get({
			userId: this.userId,
			teamId: this.teamId
		});

		if (!member) {
			throw new Error(`User(${this.userId}) not part of team(${this.teamId}).`);
		}

		return member.role;
	}

	get members() {
		if (this.role === 'INVITED') {
			throw new Error('Only team owners and members can see other members.');
		}

		const team = teamWithMembersQuery.get({ teamId: this.teamId });

		if (!team) {
			throw new Error(`Team(${this.teamId}) not found.`);
		}

		return team.members;
	}

	invite(inviteeId: string) {
		if (this.role !== 'OWNER') {
			throw new Error('Only team owners can invite users.');
		}

		db.transaction(() => {
			const foundUser = userNotInTeamQuery.get({
				userId: inviteeId,
				teamId: this.teamId
			});

			if (!foundUser) {
				throw new Error('User not found or already part of team/invited.');
			}

			db.insert(schema.teamMember)
				.values({
					userId: inviteeId,
					teamId: this.teamId,
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
					eq(schema.teamMember.teamId, this.teamId)
				)
			)
			.returning()
			.get();

		if (!removedMember) {
			throw new Error(
				`Could not remove member(${memberId}) from team(${this.teamId}).`
			);
		}
	}

	private setMemberRole(memberId: string, role: TeamRole) {
		db.transaction(() => {
			const member = teamMemberQuery.get({
				userId: memberId,
				teamId: this.teamId
			});

			if (!member) {
				throw new Error(`User(${memberId}) not part of team(${this.teamId}).`);
			}

			db.update(schema.teamMember)
				.set({ role })
				.where(
					and(
						eq(schema.teamMember.userId, member.userId),
						eq(schema.teamMember.teamId, this.teamId)
					)
				)
				.returning()
				.get();
		});
	}
}

export class UserTeam {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	get(teamId: number): Team {
		return new Team(teamId, this.userId);
	}

	get all(): Team[] {
		return teamMembersByUserQuery
			.all({ userId: this.userId })
			.map((member) => new Team(member.teamId, member.userId));
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
