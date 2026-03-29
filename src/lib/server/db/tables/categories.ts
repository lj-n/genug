import { sql } from 'drizzle-orm';
import { check, sqliteTable, unique, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createId } from '../../utils/create-id';
import { budgets } from './budgets';

export const categories = sqliteTable(
	'categories',
	(t) => ({
		budgetId: t
			.text('budget_id')
			.references(() => budgets.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: t
			.integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		id: t
			.text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		name: t.text('name').notNull(),
		notes: t.text('notes'),
		targetBalance: t.integer('target_balance', { mode: 'number' })
	}),
	(table) => [
		uniqueIndex('category_budget_unique').on(table.id, table.budgetId),
		unique('category_name_budget_unique').on(table.name, table.budgetId),
		check('target_balance_positive', sql`${table.targetBalance} > 0`)
	]
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import('../create-database');

	it('categories - unique constraints', async () => {
		const database = createDatabase(':memory:');

		const [budget] = await database
			.insert(budgets)
			.values({
				name: 'Budget 1'
			})
			.returning();

		await database.insert(categories).values({
			budgetId: budget.id,
			name: 'Category 1'
		});

		await expect(
			database.insert(categories).values({
				budgetId: budget.id,
				name: 'Category 1' // same name
			})
		).rejects.toThrow();
	});
}
