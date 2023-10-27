import { db } from './db';
import { schema } from './schema';
import type { DBTeam } from './schema/tables';

export class Team {
	id: number;

	constructor(id: number) {
		const team = teamQuery.get({ id });
		if (!team) {
			throw new Error('Team does not exists in database.');
		}

		this.id = team.id;
	}

	get(id: number) {
		return teamWithMemberQuery.get({ id });
	}

	getAll() {
    return teamsWithMemberQuery.all()
  }

	static create({
		ownerId,
		teamname,
		description
	}: {
		/** id of the user creating the team */
		ownerId: string;
		teamname: string;
		description?: string;
	}): DBTeam {
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
					userId: ownerId,
					teamId: team.id
				})
				.returning()
				.get();

			return team;
		});
	}
}

const teamQuery = db.query.team
	.findFirst({
		where: (team, { eq, sql }) => eq(team.id, sql.placeholder('id'))
	})
	.prepare();

const teamWithMemberQuery = db.query.team
	.findFirst({
		where: (team, { eq, sql }) => eq(team.id, sql.placeholder('id')),
		with: {
			member: {
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

const teamsWithMemberQuery = db.query.team
	.findMany({
		where: (team, { eq, sql }) => eq(team.id, sql.placeholder('id')),
		with: {
			member: {
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
