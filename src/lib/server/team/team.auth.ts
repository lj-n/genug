import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { SelectTeam, TeamRole } from '../schema/tables';

export function createTeam({
  userId,
  teamname,
  description
}: {
  userId: string
  teamname: string;
  description?: string;
}): SelectTeam {
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
        userId: userId,
        teamId: team.id
      })
      .returning()
      .get();

    return team;
  });
}

export function useTeamAuth(teamId: number, userId: string) {
	function getRole() {
		const member = teamMemberFindFirst.get({ teamId, userId });

		if (!member) {
			throw new Error(`User(${userId}) not part of team(${teamId}).`);
		}

		return member.role;
	}

	function inviteUser(inviteeId: string) {
		if (getRole() !== 'OWNER') {
			throw new Error('Only team owners can invite users.');
		}

		db.transaction(() => {
			const foundUser = userNotInTeamQuery.get({
				userId: inviteeId,
				teamId
			});

			if (!foundUser) {
				throw new Error('User not found or already part of team/invited.');
			}

			db.insert(schema.teamMember)
				.values({
					userId: inviteeId,
					role: 'INVITED',
					teamId
				})
				.returning()
				.get();
		});
	}

	function acceptInvite() {
		if (getRole() !== 'INVITED') {
			throw new Error(`User(${userId}) is not invited.`);
		}

		setRole(userId, 'MEMBER');
	}

	function cancelInvite() {
		if (getRole() !== 'INVITED') {
			throw new Error(`User(${userId}) is not invited.`);
		}

		removeMember(userId);
	}

	function setRole(memberId: string, role: TeamRole) {
		db.transaction(() => {
			const member = teamMemberFindFirst.get({
				userId: memberId,
				teamId
			});

			if (!member) {
				throw new Error(`User(${memberId}) not part of team(${teamId}).`);
			}

			const updatedMember = db
				.update(schema.teamMember)
				.set({ role })
				.where(
					and(
						eq(schema.teamMember.userId, member.userId),
						eq(schema.teamMember.teamId, teamId)
					)
				)
				.returning()
				.get();

			if (!updatedMember) {
				throw new Error(
					`Could not update team(${teamId}) member(${memberId}) role`
				);
			}
		});
	}

	function removeMember(memberId: string) {
		if (memberId !== userId && getRole() !== 'OWNER') {
			throw new Error(
				'You must be the team member to be removed or team owner'
			);
		}

		const removedMember = db
			.delete(schema.teamMember)
			.where(
				and(
					eq(schema.teamMember.userId, memberId),
					eq(schema.teamMember.teamId, teamId)
				)
			)
			.returning()
			.get();

		if (!removedMember) {
			throw new Error(
				`Could not remove member(${memberId}) from team(${teamId}).`
			);
		}
	}

	function makeMemberOwner(memberId: string) {
		if (getRole() !== 'OWNER') {
			throw new Error('Only team owners can promote team member.');
		}

		setRole(memberId, 'OWNER');
	}

	function getMembers() {
		getRole();
		return teamMemberFindMany.all({ teamId });
	}

	return {
		getRole,
		inviteUser,
		acceptInvite,
		cancelInvite,
		removeMember,
		makeMemberOwner,
		getMembers
	};
}

const teamMemberFindFirst = db.query.teamMember
	.findFirst({
		where: (member, { and, eq, sql }) => {
			return and(
				eq(member.teamId, sql.placeholder('teamId')),
				eq(member.userId, sql.placeholder('userId'))
			);
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

const teamMemberFindMany = db.query.teamMember
	.findMany({
		where: (member, { eq, sql }) => {
			return eq(member.teamId, sql.placeholder('teamId'));
		},
		columns: {
			teamId: false,
			userId: false
		},
		with: {
			user: true
		}
	})
	.prepare();
