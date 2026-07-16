import { type Database, tables } from '$db';
import { dateIsInMonth, dateIsOnOrBefore } from '$db/month-sql';
import { type Month, parseMonth } from '$lib/utils/month';
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

/**
 * Decomposition of Unassigned(M) into the terms a user can check against
 * their own data: Position is the running income-minus-assignments through
 * the viewed month, Reserved the part withheld because a later month runs
 * lower, and Bottleneck the earliest month at/after M pinning that minimum
 * (null when the viewed month itself is the minimum, i.e. Reserved = 0).
 * Invariant: unassigned = position − reserved.
 */
export type UnassignedBreakdown = {
	assignedUntilMonth: number;
	bottleneck: Month | null;
	incomeUntilMonth: number;
	position: number;
	reserved: number;
	unassigned: number;
};

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
 *   Unassigned(M) = min over K ≥ M of (income≤K − assignments≤K)
 *
 * Income is transactions without a category; comparisons are month-granular
 * (income by `strftime('%Y%m', date)`, assignments by their `month` column).
 * Taking the lowest running position at M and every later month means a
 * future deficit reaches back (assigning money that is spoken for later warns
 * now), while future income counts only from its own month onward — it can
 * never fund an assignment in a month before it arrives. The min-scan's
 * intermediate values are returned as an `UnassignedBreakdown` so the UI can
 * explain the number without recomputing it (#73). Access control is the
 * caller's responsibility.
 */
export function unassigned(db: Database, budgetId: string, month: Month): UnassignedBreakdown {
	const assignments = db
		.select({
			month: tables.budgetAssignments.month,
			total: sql<number>`sum(${tables.budgetAssignments.amount})`.as('total')
		})
		.from(tables.budgetAssignments)
		.where(eq(tables.budgetAssignments.budgetId, budgetId))
		.groupBy(tables.budgetAssignments.month)
		.all();

	const income = db
		.select({
			month: sql<number>`cast(strftime('%Y%m', ${tables.transactions.date}) AS integer)`.as(
				'month'
			),
			total: sql<number>`sum(${tables.transactions.amount})`.as('total')
		})
		.from(tables.transactions)
		.where(
			and(
				eq(tables.transactions.budgetId, budgetId),
				isNull(tables.transactions.categoryId),
				// Transfer legs are budget-neutral by explicit exclusion, not by
				// relying on the two legs cancelling out (ADR-0015).
				isNull(tables.transactions.transferId)
			)
		)
		.groupBy(sql`strftime('%Y%m', ${tables.transactions.date})`)
		.all();

	// Net change of the running position per month, with M itself as a
	// checkpoint so position(M) participates in the minimum even when the
	// month has no entries of its own.
	const deltas = new Map<number, number>([[month, 0]]);
	for (const row of income) deltas.set(row.month, (deltas.get(row.month) ?? 0) + row.total);
	for (const row of assignments) deltas.set(row.month, (deltas.get(row.month) ?? 0) - row.total);

	let incomeUntilMonth = 0;
	let assignedUntilMonth = 0;
	for (const row of income) if (row.month <= month) incomeUntilMonth += row.total;
	for (const row of assignments) if (row.month <= month) assignedUntilMonth += row.total;

	// M is the first checkpoint ≥ M, so `lowestMonth` starts there; a strict
	// `<` keeps the earliest month on ties — the first month that binds.
	let running = 0;
	let lowest = Infinity;
	let lowestMonth: number = month;
	for (const m of [...deltas.keys()].sort((a, b) => a - b)) {
		running += deltas.get(m) ?? 0;
		if (m >= month && running < lowest) {
			lowest = running;
			lowestMonth = m;
		}
	}

	const position = incomeUntilMonth - assignedUntilMonth;
	return {
		assignedUntilMonth,
		bottleneck: lowestMonth === month ? null : parseMonth(lowestMonth),
		incomeUntilMonth,
		position,
		reserved: position - lowest,
		unassigned: lowest
	};
}
