import { sql } from 'drizzle-orm';
import { check, foreignKey, index, sqliteTable } from 'drizzle-orm/sqlite-core';

import { createId } from '../../utils/create-id';
import { accounts } from './accounts';
import { budgets } from './budgets';
import { categories } from './categories';
import { users } from './users';

export const transactions = sqliteTable(
	'transactions',
	(t) => ({
		accountId: t
			.text('account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),
		amount: t.integer('amount', { mode: 'number' }).notNull(),
		budgetId: t
			.text('budget_id')
			.references(() => budgets.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: t.text('category_id').references(() => categories.id, {
			onDelete: 'set null'
		}),
		createdAt: t
			.integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		createdBy: t.text('created_by').references(() => users.id, {
			onDelete: 'set null'
		}),
		date: t.text('date').notNull(),
		id: t
			.text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		notes: t.text('notes'),
		validated: t.integer('validated', { mode: 'boolean' }).default(false).notNull()
	}),
	(t) => [
		index('transaction_budget').on(t.budgetId),
		index('transaction_account').on(t.accountId),
		index('transaction_account_date').on(t.accountId, t.date),
		foreignKey({
			columns: [t.accountId, t.budgetId],
			foreignColumns: [accounts.id, accounts.budgetId]
		}),
		foreignKey({
			columns: [t.categoryId, t.budgetId],
			foreignColumns: [categories.id, categories.budgetId]
		}),
		check('date_format', sql`${t.date} LIKE '____-__-__'`)
	]
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import('../create-database');

	it('transactions - foreign key constraints', async () => {
		const database = createDatabase(':memory:');

		const [budget] = await database
			.insert(budgets)
			.values({
				name: 'Budget 1'
			})
			.returning();

		const [account] = await database
			.insert(accounts)
			.values({
				budgetId: budget.id,
				name: 'Account 1'
			})
			.returning();

		const [category] = await database
			.insert(categories)
			.values({
				budgetId: budget.id,
				name: 'Category 1'
			})
			.returning();

		await expect(
			database.insert(transactions).values({
				accountId: 'nonexistent_account', // invalid accountId
				amount: 1000,
				budgetId: budget.id,
				categoryId: category.id,
				date: new Date().toISOString().split('T')[0] // format as YYYY-MM-DD
			})
		).rejects.toThrow();

		await expect(
			database.insert(transactions).values({
				accountId: account.id,
				amount: 1000,
				budgetId: budget.id,
				categoryId: 'nonexistent_category', // invalid categoryId
				date: new Date().toISOString().split('T')[0] // format as YYYY-MM-DD
			})
		).rejects.toThrow();

		const [secondBudget] = await database
			.insert(budgets)
			.values({
				name: 'Budget 2'
			})
			.returning();

		await expect(
			database.insert(transactions).values({
				accountId: account.id,
				amount: 1000,
				budgetId: secondBudget.id, // mismatched budgetId - accountId
				categoryId: category.id,
				date: new Date().toISOString().split('T')[0] // format as YYYY-MM-DD
			})
		).rejects.toThrow();
	});

	it('transactions - date format check constraint', async () => {
		const database = createDatabase(':memory:');

		const [budget] = await database
			.insert(budgets)
			.values({
				name: 'Budget 1'
			})
			.returning();

		const [account] = await database
			.insert(accounts)
			.values({
				budgetId: budget.id,
				name: 'Account 1'
			})
			.returning();

		const [category] = await database
			.insert(categories)
			.values({
				budgetId: budget.id,
				name: 'Category 1'
			})
			.returning();

		database.insert(transactions).values({
			accountId: account.id,
			amount: 1000,
			budgetId: budget.id,
			categoryId: category.id,
			date: '2023-12-31' // valid date
		});

		await expect(
			database.insert(transactions).values({
				accountId: account.id,
				amount: 1000,
				budgetId: budget.id,
				categoryId: category.id,
				date: '12/31/2023' // invalid date
			})
		).rejects.toThrow();
	});
}
