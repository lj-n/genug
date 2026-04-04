import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, eq, getColumns, isNull, lte, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';

export function createBudgetActions({
	database,
	user
}: {
	database: App.Database;
	user: App.User;
}) {
	return {
		async all() {
			return database
				.select()
				.from(tables.budgets)
				.where(
					userHasPermission({
						budgetIdCol: tables.budgets.id,
						database,
						userId: user.id
					})
				);
		},

		/**
		 * Retrieves all categories for a given budget and month, along with various aggregated data such as activity, assigned budget, and related transactions.
		 */
		async month({ budgetId, month }: { budgetId: string; month: number }) {
			return database
				.select({
					...getColumns(tables.categories),

					pendingTransactionCount: sql<number>`
						${pendingTransactionCount({
							categoryId: tables.categories.id,
							database
						})}`,

					thisMonthActivity: sql<number>`
						${activity({
							categoryId: tables.categories.id,
							database,
							month
						})}`,

					thisMonthAmount: sql<number>`coalesce(${tables.budgetAssignments.amount}, 0)`,

					thisMonthRemaining: sql<number>`
						${remaining({
							categoryId: tables.categories.id,
							database,
							month
						})}`,

					totalAssignedBudgetCount: sql<number>`
						${totalAssignedBudgetCount({
							categoryId: tables.categories.id,
							database
						})}`,

					totalAssignedBudgetSum: sql<number>`
						${totalAssignedBudget({
							categoryId: tables.categories.id,
							database
						})}`,

					totalRelatedTransactionCount: sql<number>`
						${totalRelatedTransactionCount({
							categoryId: tables.categories.id,
							database
						})}`,

					totalRelatedTransactionSum: sql<number>`
						${totalRelatedTransactionSum({
							categoryId: tables.categories.id,
							database
						})}`
				})
				.from(tables.categories)
				.leftJoin(
					tables.budgetAssignments,
					and(
						eq(tables.budgetAssignments.categoryId, tables.categories.id),
						eq(tables.budgetAssignments.month, month)
					)
				)
				.where(
					and(
						isNull(tables.categories.archived_at),
						eq(tables.categories.budgetId, budgetId),
						userHasPermission({
							budgetIdCol: tables.categories.budgetId,
							database,
							userId: user.id
						})
					)
				);
		}
	};
}

/**
 * Sum of all transactions related to a category in the given month
 */
function activity({
	categoryId,
	database,
	month
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
	month: number; // YYYYMM
}) {
	return database
		.select({
			budget: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(
			and(
				eq(tables.transactions.categoryId, categoryId),
				eq(sql<number>`strftime('%Y%m', ${tables.transactions.date})`, month.toString())
			)
		);
}

/**
 * Calculates the count of pending transactions for a specific category
 */
function pendingTransactionCount({
	categoryId,
	database
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			count: sql<number>`coalesce(count(*), 0)`
		})
		.from(tables.transactions)
		.where(
			and(eq(tables.transactions.categoryId, categoryId), eq(tables.transactions.validated, false))
		);
}

function remaining({
	categoryId,
	database,
	month
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
	month: number; // YYYYMM
}) {
	/**
	 * Calculates the cumulative budget amount assigned to a specific category up to and including a given month.
	 * Sums all budget assignments for the category where the assignment month is less than or equal to the specified month.
	 * Returns 0 if no assignments exist.
	 */
	const budgetSumToMonth = database
		.select({
			sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`
		})
		.from(tables.budgetAssignments)
		.where(
			and(
				eq(tables.budgetAssignments.categoryId, categoryId),
				lte(tables.budgetAssignments.month, month)
			)
		);

	/**
	 * Calculates the cumulative transaction amount for a specific category up to and including a given month.
	 * Sums all transactions for the category where the transaction month is less than or equal to the specified month.
	 * Returns 0 if no transactions exist.
	 */
	const transactionSumToMonth = database
		.select({
			sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(
			and(
				eq(tables.transactions.categoryId, categoryId),
				lte(sql`strftime('%Y%m', ${tables.transactions.date})`, month.toString())
			)
		);

	return sql<number>`${budgetSumToMonth} + ${transactionSumToMonth}`;
}

/**
 * Calculates the total assigned budget for a specific category by summing all budget assignments related to that category.
 * Returns 0 if no assignments exist.
 */
function totalAssignedBudget({
	categoryId,
	database
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.categoryId, categoryId));
}

/**
 * Counts the total number of budget assignments related to a specific category by counting the assignment records that match the category ID.
 * Returns 0 if no assignments exist.
 */
function totalAssignedBudgetCount({
	categoryId,
	database
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			count: sql<number>`coalesce(count(*), 0)`
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.categoryId, categoryId));
}

/**
 * Counts the total number of transactions related to a specific category by counting the transaction records that match the category ID.
 * Returns 0 if no transactions exist.
 */
function totalRelatedTransactionCount({
	categoryId,
	database
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			count: sql<number>`coalesce(count(*), 0)`
		})
		.from(tables.transactions)
		.where(eq(tables.transactions.categoryId, categoryId));
}

/**
 * Calculates the total sum of all transactions related to a specific category by summing the amounts of those transactions.
 * Returns 0 if no transactions exist.
 */
function totalRelatedTransactionSum({
	categoryId,
	database
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(eq(tables.transactions.categoryId, categoryId));
}
