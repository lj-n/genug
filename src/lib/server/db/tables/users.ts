import { DAY_IN_MS } from '$db/auth/utils';
import { sql } from 'drizzle-orm';
import { index, primaryKey, sqliteTable, unique, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createId } from '../../utils/create-id';

export const entityOrderTypes = ['budget', 'account', 'category'] as const;

export const sessions = sqliteTable(
	'sessions',
	(t) => ({
		expiresAt: t
			.integer('expires_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date(Date.now() + DAY_IN_MS * 20))
			.notNull(),
		id: t.text('id').primaryKey(),
		userId: t
			.text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
	}),
	(t) => [index('session_user').on(t.userId)]
);

export const users = sqliteTable(
	'users',
	(t) => ({
		createdAt: t
			.integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		id: t
			.text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		isAdmin: t.integer({ mode: 'boolean' }).default(false).notNull(),
		passwordHash: t.text('password_hash').notNull(),
		username: t.text('username').notNull().unique()
	}),
	(t) => [
		uniqueIndex('admin_unique')
			.on(t.isAdmin)
			.where(sql`${t.isAdmin} = 1`),
		unique('username_unique').on(t.username)
	]
);

export const userEntityOrder = sqliteTable(
	'user_entity_order',
	(t) => ({
		entityId: t.text('entity_id').notNull(),
		entityType: t.text('entity_type', { enum: entityOrderTypes }).notNull(),
		position: t.integer('position').notNull(),
		userId: t
			.text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
	}),
	(t) => [
		primaryKey({ columns: [t.userId, t.entityType, t.entityId] }),
		index('user_entity_order_sort_idx').on(t.userId, t.entityType, t.position)
	]
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import('../create-database');

	it('users - unique constraints', async () => {
		const database = createDatabase(':memory:');

		await database.insert(users).values({
			passwordHash: 'hash1',
			username: 'user1'
		});

		await expect(
			database.insert(users).values({
				passwordHash: 'hash2',
				username: 'user1' // same username
			})
		).rejects.toThrow();
	});
}
