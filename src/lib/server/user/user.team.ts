import { db } from '../db';

export function useUserTeam(userId: string) {
	function get(teamId: number) {
		const result = memberWithTeamFindFirst.get({ userId, teamId });

		if (!result) {
			throw new Error('Team not found.');
		}

		return result.team;
	}

	function getAll() {
		return memberWithTeamFindMany.all({ userId }).map(({ team }) => team);
	}

	return {
		get,
		getAll
	};
}

const memberWithTeamFindFirst = db.query.teamMember
	.findFirst({
		where: (member, { and, eq, sql }) => {
			return and(
				eq(member.teamId, sql.placeholder('teamId')),
				eq(member.userId, sql.placeholder('userId'))
			);
		},
		with: { team: true }
	})
	.prepare();

const memberWithTeamFindMany = db.query.teamMember
	.findMany({
		where: (member, { eq, sql }) => {
			return eq(member.userId, sql.placeholder('userId'));
		},
		with: { team: true }
	})
	.prepare();
