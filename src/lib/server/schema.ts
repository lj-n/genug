import { relations, sql } from 'drizzle-orm';
import {
	sqliteTable,
	text,
	integer,
	primaryKey
} from 'drizzle-orm/sqlite-core';

export const session = sqliteTable('user_session', {
	id: text('id', { length: 128 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	activeExpires: integer('active_expires', { mode: 'number' }).notNull(),
	idleExpires: integer('idle_expires', { mode: 'number' }).notNull()
});

export const key = sqliteTable('user_key', {
	id: text('id', { length: 255 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	hashedPassword: text('hashed_password', { length: 255 })
});

export const token = sqliteTable('token', {
	id: text('id', { length: 63 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	expires: integer('expires', { mode: 'number' }).notNull()
});

export const user = sqliteTable('user', {
	id: text('id', { length: 15 }).primaryKey(),
	email: text('email', { length: 32 }).notNull().unique(),
	email_verified: integer('email_verified').notNull(),
	name: text('name', { length: 255 }).notNull()
});

export const userRelations = relations(user, ({ many }) => ({
	teamMember: many(teamMember)
}));

export const team = sqliteTable('team', {
	id: integer('id').primaryKey(),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull()
});

export const teamRelations = relations(team, ({ many }) => ({
	teamMember: many(teamMember)
}));

export const teamMember = sqliteTable(
	'team_user',
	{
		user_id: text('user_id', { length: 15 })
			.notNull()
			.references(() => user.id),
		team_id: integer('team_id')
			.notNull()
			.references(() => team.id),
		role_id: integer('role_id')
			.notNull()
			.references(() => teamRole.id)
	},
	(table) => {
		return {
			pk: primaryKey(table.user_id, table.team_id)
		};
	}
);

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	user: one(user, {
		fields: [teamMember.user_id],
		references: [user.id]
	}),
	team: one(team, {
		fields: [teamMember.team_id],
		references: [team.id]
	}),
	role: one(teamRole, {
		fields: [teamMember.role_id],
		references: [teamRole.id]
	})
}));

export const teamRole = sqliteTable('team_role', {
	id: integer('id').primaryKey(),
	type: text('type', { enum: ['OWNER', 'MEMBER', 'INVITED'] }).notNull(), // OWNER | MEMBER | INVITED
	description: text('description', { length: 255 }).notNull()
});
