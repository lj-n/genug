import { sql } from 'drizzle-orm';
import { schema, db } from '.';

type Team = {
	id: number;
	name: string;
	createdAt: string;
	description: string | null;
	member: TeamMember[];
};

type TeamMember = {
	name: string;
	email: string;
	role: 'OWNER' | 'MEMBER' | 'INVITED';
};

export async function createTeam(
	name: string,
	creatorId: string,
	description?: string
) {
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

	return team;
}

const prepared = db.query.team
	.findFirst({
		where: (team, { eq }) => eq(team.id, sql.placeholder('id')),
		with: {
			teamMember: {
				with: {
					user: true
				}
			}
		}
	})
	.prepare();

export async function getTeam(id: number) {
  //
}
