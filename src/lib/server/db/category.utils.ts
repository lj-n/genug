import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, eq, lte, sql } from 'drizzle-orm';

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

export function thisMonthActivity({
	categoryId,
	database,
	month
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
	month: number;
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

export function thisMonthRemaining({
	categoryId,
	database,
	month
}: {
	categoryId: SQLiteColumn;
	database: App.Database;
	month: number;
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
