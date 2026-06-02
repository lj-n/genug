import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, eq, lte, sql } from 'drizzle-orm';

/**
 * Calculates the count of pending transactions for a specific category
 */
export function pendingTransactionCount({
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

/**
 * Sum of all transactions related to a category in the given month
 */
export function thisMonthActivity({
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
 * Calculates the remaining budget for the category in the given month, taking into account both the assigned budget and the activity of the month.
 * Returns 0 if no budget is assigned and no activity exists for the category in the given month.
 */
export function thisMonthRemaining({
	categoryId,
	database,
	month
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
	month: number; // YYYYMM
}) {
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
export function totalAssignedBudget({
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
export function totalAssignedBudgetCount({
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
export function totalRelatedTransactionCount({
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
export function totalRelatedTransactionSum({
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
