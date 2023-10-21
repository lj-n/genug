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
	name: text('name', { length: 255 }).notNull().unique()
});

export const team = sqliteTable('team', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull()
});

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

export const userAccount = sqliteTable('user_account', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull()
});

export const userTransaction = sqliteTable('user_transaction', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id')
		.notNull()
		.references(() => userCategory.id, { onDelete: 'cascade' }),
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
	validated: integer('validated', { mode: 'boolean' }).default(false).notNull()
});

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
