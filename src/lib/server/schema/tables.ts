import { sql } from 'drizzle-orm';
import {
	sqliteTable,
	text,
	integer,
	primaryKey,
	blob
} from 'drizzle-orm/sqlite-core';

export const session = sqliteTable('user_session', {
	id: text('id', { length: 128 }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'number' }).notNull()
});

export const user = sqliteTable('user', {
	id: text('id', { length: 15 }).primaryKey(),
	name: text('name', { length: 255 }).notNull().unique(),
	isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
	hashedPassword: text('hashed_password', { length: 255 }).notNull()
});

export const userSettings = sqliteTable('user_settings', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	theme: text('theme', { enum: ['light', 'dark', 'system'] })
		.notNull()
		.default('system'),
	categoryOrder: text('category_order', { mode: 'json' }).$type<number[]>()
});

export const userAvatar = sqliteTable(
	'user_avatar',
	{
		userId: text('user_id', { length: 15 })
			.notNull()
			.references(() => user.id, {
				onDelete: 'cascade'
			}),
		image: blob('image', { mode: 'buffer' }),
		imageType: text('image_type')
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.userId] })
		};
	}
);

export const category = sqliteTable('category', {
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
	retired: integer('retired', { mode: 'boolean' }).default(false).notNull(),
	teamId: integer('team_id').references(() => team.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name', { length: 255 }).notNull(),
	description: text('description', { length: 255 }),
	createdAt: text('created_at')
		.default(sql`CURRENT_DATE`)
		.notNull(),
	teamId: integer('team_id').references(() => team.id, { onDelete: 'cascade' })
});

export const transaction = sqliteTable('transaction', {
	id: integer('id', { mode: 'number' }).primaryKey(),
	userId: text('user_id', { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').references(() => category.id, {
		onDelete: 'cascade'
	}),
	accountId: integer('account_id')
		.notNull()
		.references(() => account.id, { onDelete: 'cascade' }),
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

export const budget = sqliteTable(
	'budget',
	{
		userId: text('user_id', { length: 15 })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => category.id, { onDelete: 'cascade' }),
		date: text('date', { length: 7 }).notNull(), // sql`strftime('%Y-%m', 'now')`
		amount: integer('amount', { mode: 'number' }).default(0).notNull()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.categoryId, table.date] })
		};
	}
);

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
			pk: primaryKey({ columns: [table.userId, table.teamId] })
		};
	}
);

export type TeamRole = typeof teamMember.$inferSelect.role;
