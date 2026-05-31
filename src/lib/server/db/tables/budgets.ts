import { CURRENCIES } from '$lib/utils/currencies';
import { sql } from 'drizzle-orm';
import { check, foreignKey, index, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

import { createId } from '../../utils/create-id';
import { categories } from './categories';
import { users } from './users';

export type Budget = typeof budgets.$inferSelect;

export const budgets = sqliteTable('budgets', (t) => ({
	createdAt: t
		.integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	currency: t.text('currency', { enum: CURRENCIES }).default('EUR').notNull(),
	id: t
		.text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: t.text('name').notNull()
}));

export const usersToBudgets = sqliteTable(
	'users_to_budgets',
	(t) => ({
		budgetId: t
			.text('budget_id')
			.references(() => budgets.id, { onDelete: 'cascade' })
			.notNull(),
		role: t.text('role', { enum: ['OWNER', 'MEMBER', 'INVITEE'] }).notNull(),
		userId: t
			.text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
	}),
	(t) => [primaryKey({ columns: [t.userId, t.budgetId] })]
);

export const budgetAssignments = sqliteTable(
	'budget_assignments',
	(t) => ({
		amount: t.integer('amount').notNull(),
		budgetId: t
			.text('budget_id')
			.references(() => budgets.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: t
			.text('category_id')
			.references(() => categories.id, { onDelete: 'cascade' })
			.notNull(),
		month: t.integer('month').notNull()
	}),
	(t) => [
		index('budget_assignment_month').on(t.budgetId, t.month),
		primaryKey({ columns: [t.categoryId, t.month] }),
		foreignKey({
			columns: [t.categoryId, t.budgetId],
			foreignColumns: [categories.id, categories.budgetId]
		}),
		check(
			'date_format',
			sql`${t.month} between 190001 and 210012 AND ${t.month} % 100 between 1 and 12`
		)
	]
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import('../create-database');

	it('budgets - date format check constraint', async () => {
		const database = createDatabase(':memory:');

		const [budget] = await database
			.insert(budgets)
			.values({
				name: 'Budget 1'
			})
			.returning();

		const [category] = await database
			.insert(categories)
			.values({
				budgetId: budget.id,
				name: 'Category 1'
			})
			.returning();

		database.insert(budgetAssignments).values({
			amount: 1000,
			budgetId: budget.id,
			categoryId: category.id,
			month: 202312 // valid month
		});

		await expect(
			database.insert(budgetAssignments).values({
				amount: 1000,
				budgetId: budget.id,
				categoryId: category.id,
				month: 202313 // invalid month
			})
		).rejects.toThrow();
	});
}
