import type { Month } from '$lib/utils/month';

import { type Database, tables } from '$db';
import { dateIsInMonth, dateIsOnOrBefore } from '$db/month-sql';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';

/**
 * Internal seam that owns all envelope math.
 *
 * Callers join the returned subquery against `categories` on `categoryId`
 * and coalesce the columns they need. Both the all-time family (always
 * present) and the month family (scoped to the passed Month) are available
 * under distinct names — there is no cutoff mode parameter.
 *
 * To avoid drift, assignment⨝transaction aggregates at category or budget
 * level must live here and nowhere else (ADR-0004).
 */

export function categoryBalances(db: Database, month: Month) {
	// ── transaction aggregate ──────────────────────────────────────────
	const txAgg = db
		.select({
			activity:
				sql<number>`coalesce(sum(CASE WHEN ${dateIsInMonth(tables.transactions.date, month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
					'activity'
				),
			allTimeTransactionSum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`.as(
				'allTimeTransactionSum'
			),
			categoryId: tables.transactions.categoryId,
			pendingCount:
				sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = false THEN 1 ELSE 0 END), 0)`.as(
					'pendingCount'
				),
			txCount: sql<number>`count(*)`.as('txCount'),
			txSumUntilMonth:
				sql<number>`coalesce(sum(CASE WHEN ${dateIsOnOrBefore(tables.transactions.date, month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
					'txSumUntilMonth'
				)
		})
		.from(tables.transactions)
		.where(isNotNull(tables.transactions.categoryId))
		.groupBy(tables.transactions.categoryId)
		.as('txAgg');

	// ── assignment aggregate ───────────────────────────────────────────
	const assignmentAgg = db
		.select({
			allTimeAssignmentSum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`.as(
				'allTimeAssignmentSum'
			),
			assignCount: sql<number>`count(*)`.as('assignCount'),
			assigned:
				sql<number>`coalesce(sum(CASE WHEN ${tables.budgetAssignments.month} = ${month} THEN ${tables.budgetAssignments.amount} ELSE 0 END), 0)`.as(
					'assigned'
				),
			assignSumUntilMonth:
				sql<number>`coalesce(sum(CASE WHEN ${tables.budgetAssignments.month} <= ${month} THEN ${tables.budgetAssignments.amount} ELSE 0 END), 0)`.as(
					'assignSumUntilMonth'
				),
			categoryId: tables.budgetAssignments.categoryId
		})
		.from(tables.budgetAssignments)
		.groupBy(tables.budgetAssignments.categoryId)
		.as('assignmentAgg');

	// ── every category id that appears in either source ────────────────
	const allCategoryIds = db
		.select({ categoryId: tables.transactions.categoryId })
		.from(tables.transactions)
		.where(isNotNull(tables.transactions.categoryId))
		.union(
			db.select({ categoryId: tables.budgetAssignments.categoryId }).from(tables.budgetAssignments)
		)
		.as('allCategoryIds');

	return db
		.select({
			// month family
			activity: sql<number>`coalesce(${txAgg.activity}, 0)`.as('activity'),
			// all-time family
			allTimeAssignmentSum: sql<number>`coalesce(${assignmentAgg.allTimeAssignmentSum}, 0)`.as(
				'allTimeAssignmentSum'
			),
			allTimeRemaining:
				sql<number>`coalesce(${assignmentAgg.allTimeAssignmentSum}, 0) + coalesce(${txAgg.allTimeTransactionSum}, 0)`.as(
					'allTimeRemaining'
				),
			allTimeTransactionSum: sql<number>`coalesce(${txAgg.allTimeTransactionSum}, 0)`.as(
				'allTimeTransactionSum'
			),
			assignCount: sql<number>`coalesce(${assignmentAgg.assignCount}, 0)`.as('assignCount'),
			assigned: sql<number>`coalesce(${assignmentAgg.assigned}, 0)`.as('assigned'),
			categoryId: allCategoryIds.categoryId,
			pendingCount: sql<number>`coalesce(${txAgg.pendingCount}, 0)`.as('pendingCount'),
			remaining:
				sql<number>`coalesce(${assignmentAgg.assignSumUntilMonth}, 0) + coalesce(${txAgg.txSumUntilMonth}, 0)`.as(
					'remaining'
				),
			txCount: sql<number>`coalesce(${txAgg.txCount}, 0)`.as('txCount')
		})
		.from(allCategoryIds)
		.leftJoin(txAgg, eq(txAgg.categoryId, allCategoryIds.categoryId))
		.leftJoin(assignmentAgg, eq(assignmentAgg.categoryId, allCategoryIds.categoryId))
		.as('categoryBalances');
}

/**
 * Budget-lifetime income (transactions without a category) minus all
 * assignments. Access control is the caller's responsibility.
 */
export function unassigned(db: Database, budgetId: string): number {
	const [assignmentTotal] = db
		.select({
			sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`.as('sum')
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.budgetId, budgetId))
		.all();

	const [incomeTotal] = db
		.select({
			sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`.as('sum')
		})
		.from(tables.transactions)
		.where(and(eq(tables.transactions.budgetId, budgetId), isNull(tables.transactions.categoryId)))
		.all();

	return (incomeTotal?.sum ?? 0) - (assignmentTotal?.sum ?? 0);
}
