import { sql } from 'drizzle-orm';
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

export const user = sqliteTable('user', {
	id: text('id', { length: 15 }).primaryKey(),
	name: text('name', { length: 255 }).notNull().unique()
});

export type SelectUser = typeof user.$inferSelect;

export const token = sqliteTable('token', {
	id: text('id', { length: 63 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expires: integer('expires', { mode: 'number' }).notNull()
});

export const userCategory = sqliteTable('user_category', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull(),
	goal: integer('goal'),
	retired: integer('retired', { mode: 'boolean' }).default(false).notNull()
});

export type SelectUserCategory = typeof userCategory.$inferSelect;
export type InsertUserCategory = typeof userCategory.$inferInsert;

export const userAccount = sqliteTable('user_account', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	balanceValidated: integer('balance_validated').default(0).notNull(),
	balanceUnvalidated: integer('balance_unvalidated').default(0).notNull(),
	balanceWorking: integer('balance_working').default(0).notNull(),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull()
});

export type SelectUserAccount = typeof userAccount.$inferSelect;
export type InsertUserAccount = typeof userAccount.$inferInsert;

export const userTransaction = sqliteTable('user_transaction', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').references(() => userCategory.id, {
		onDelete: 'cascade'
	}),
	accountId: integer('account_id')
		.notNull()
		.references(() => userAccount.id, { onDelete: 'cascade' }),
	description: text('description', { length: 255 }),
	date: text('date', { length: 10 })
		.default(sql`CURRENT_DATE`)
		.notNull(),
	createdAt: text('created_at')
		.default(sql`CURRENT_TIMESTAMP `)
		.notNull(),
	flow: integer('flow').notNull(),
	validated: integer('validated', { mode: 'boolean' }).notNull()
});

export type SelectUserTransaction = typeof userTransaction.$inferSelect;
export type InsertUserTransaction = typeof userTransaction.$inferInsert;

export const userBudget = sqliteTable(
	'user_budget',
	{
		userId: text('user_id', { length: 15 })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => userCategory.id, { onDelete: 'cascade' }),
		date: text('date', { length: 7 }).notNull(), // sql`strftime('%Y-%m', 'now')`
		amount: integer('amount', { mode: 'number' }).default(0).notNull()
	},
	(table) => {
		return {
			pk: primaryKey(table.userId, table.categoryId, table.date)
		};
	}
);

export type SelectUserBudget = typeof userBudget.$inferSelect;
export type InsertUserBudget = typeof userBudget.$inferInsert;

export const team = sqliteTable('team', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull()
});

export type SelectTeam = typeof team.$inferSelect;
export type InsertTeam = typeof team.$inferInsert;

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

export type SelectTeamMember = typeof teamMember.$inferSelect;
export type InsertTeamMember = typeof teamMember.$inferInsert;
export type TeamRole = typeof teamMember.$inferSelect.role;

export const teamCategory = sqliteTable('team_category', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	teamId: text('team_id', { length: 15 })
		.notNull()
		.references(() => team.id, { onDelete: 'cascade' }),
	createdBy: text('created_by', { length: 15 })
		.notNull()
		.references(() => user.id),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull(),
	goal: integer('goal'),
	retired: integer('retired', { mode: 'boolean' }).default(false).notNull()
});
