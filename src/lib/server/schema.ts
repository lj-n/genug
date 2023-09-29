import { pgTable, bigint, varchar, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: varchar('id', {
		length: 15
	}).primaryKey(),
	email: varchar('email', { length: 32 }).notNull().unique(),
	email_verified: integer('email_verified').notNull(),
	name: varchar('name', { length: 255 }).notNull()
});

export const session = pgTable('user_session', {
	id: varchar('id', { length: 128 }).primaryKey(),
	userId: varchar('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	activeExpires: bigint('active_expires', { mode: 'number' }).notNull(),
	idleExpires: bigint('idle_expires', { mode: 'number' }).notNull()
});

export const key = pgTable('user_key', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	hashedPassword: varchar('hashed_password', { length: 255 })
});

export const token = pgTable('token', {
	id: varchar('id', { length: 63 }).primaryKey(),
	userId: varchar('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	expires: bigint('expires', { mode: 'number' }).notNull()
});
