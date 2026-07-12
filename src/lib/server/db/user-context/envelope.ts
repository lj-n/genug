import type { Month } from '$lib/utils/month';

import { type Database, tables } from '$db';
import { dateIsAfter, dateIsInMonth, dateIsOnOrBefore } from '$db/month-sql';
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
 * Month-scoped Unassigned with reach-back (ADR-0007): budget money outside
 * every envelope as seen from month `M`.
 *
 *   Unassigned(M) = income≤M − assignments≤M − max(0, assignments>M − income>M)
 *
 * Income is transactions without a category; comparisons are month-granular
 * (income by `strftime('%Y%m', date)`, assignments by their `month` column).
 * The reach-back term charges the present month only for future assignments
 * that future income does not yet cover, so a fully-assigned past month reads
 * zero rather than a spurious negative. Access control is the caller's
 * responsibility.
 */
export function unassigned(db: Database, budgetId: string, month: Month): number {
	const [assignments] = db
		.select({
			after:
				sql<number>`coalesce(sum(CASE WHEN ${tables.budgetAssignments.month} > ${month} THEN ${tables.budgetAssignments.amount} ELSE 0 END), 0)`.as(
					'after'
				),
			until:
				sql<number>`coalesce(sum(CASE WHEN ${tables.budgetAssignments.month} <= ${month} THEN ${tables.budgetAssignments.amount} ELSE 0 END), 0)`.as(
					'until'
				)
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.budgetId, budgetId))
		.all();

	const [income] = db
		.select({
			after:
				sql<number>`coalesce(sum(CASE WHEN ${dateIsAfter(tables.transactions.date, month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
					'after'
				),
			until:
				sql<number>`coalesce(sum(CASE WHEN ${dateIsOnOrBefore(tables.transactions.date, month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
					'until'
				)
		})
		.from(tables.transactions)
		.where(and(eq(tables.transactions.budgetId, budgetId), isNull(tables.transactions.categoryId)))
		.all();

	const reachBack = Math.max(0, (assignments?.after ?? 0) - (income?.after ?? 0));
	return (income?.until ?? 0) - (assignments?.until ?? 0) - reachBack;
}
