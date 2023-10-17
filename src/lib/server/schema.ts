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
		.references(() => user.id, { onDelete: 'cascade' }),
	activeExpires: integer('active_expires', { mode: 'number' }).notNull(),
	idleExpires: integer('idle_expires', { mode: 'number' }).notNull()
});

export const key = sqliteTable('user_key', {
	id: text('id', { length: 255 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	hashedPassword: text('hashed_password', { length: 255 })
});

export const token = sqliteTable('token', {
	id: text('id', { length: 63 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expires: integer('expires', { mode: 'number' }).notNull()
});

export const user = sqliteTable('user', {
	id: text('id', { length: 15 }).primaryKey(),
	email: text('email', { length: 32 }).notNull().unique(),
	email_verified: integer('email_verified').notNull(), // must be snake case for lucia auth
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
		userId: text('user_id', { length: 15 })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		teamId: integer('team_id')
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		role: text('role', { enum: ['OWNER', 'MEMBER', 'INVITED'] }).notNull()
	},
	(table) => {
		return {
			pk: primaryKey(table.userId, table.teamId)
		};
	}
);

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	})
}));
