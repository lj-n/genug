import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, eq, isNull, sql } from 'drizzle-orm';

/**
 * Calculates the total sum of assigned budget for a specific budget.
 */
export function totalSumOfAssingments({
	budgetId,
	database
}: {
	budgetId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.budgetId, budgetId));
}

/**
 * Calculates the total sum of income for a specific budget.
 */
export function totalSumOfIncome({
	budgetId,
	database
}: {
	budgetId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(and(eq(tables.transactions.budgetId, budgetId), isNull(tables.transactions.categoryId)));
}
