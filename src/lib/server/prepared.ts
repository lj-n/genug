import { and, eq, sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from './schema';

export const getTeamMembers = db
	.select({
		userId: schema.user.id,
		email: schema.user.email,
		name: schema.user.name,
		role: schema.teamRole.type
	})
	.from(schema.teamMember)
	.innerJoin(schema.user, eq(schema.teamMember.user_id, schema.user.id))
	.innerJoin(schema.teamRole, eq(schema.teamMember.role_id, schema.teamRole.id))
	.where(eq(schema.teamMember.team_id, sql.placeholder('teamId')))
	.prepare();

export const getTeamOwner = db
	.select()
	.from(schema.teamMember)
	.where(
		and(
			eq(schema.teamMember.user_id, sql.placeholder('userId')),
			eq(schema.teamMember.team_id, sql.placeholder('teamId')),
			eq(schema.teamMember.role_id, 1)
		)
	)
	.prepare();
