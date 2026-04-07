import { tables } from '$db';
import { and, eq, getColumns, isNull, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';
import queries from './queries';

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
						${queries.category.pendingTransactionCount({
							categoryId: tables.categories.id,
							database
						})}`,

					thisMonthActivity: sql<number>`
						${queries.category.thisMonthActivity({
							categoryId: tables.categories.id,
							database,
							month
						})}`,

					thisMonthAmount: sql<number>`coalesce(${tables.budgetAssignments.amount}, 0)`,

					thisMonthRemaining: sql<number>`
						${queries.category.thisMonthRemaining({
							categoryId: tables.categories.id,
							database,
							month
						})}`,

					totalAssignedBudgetCount: sql<number>`
						${queries.category.totalAssignedBudgetCount({
							categoryId: tables.categories.id,
							database
						})}`,

					totalAssignedBudgetSum: sql<number>`
						${queries.category.totalAssignedBudget({
							categoryId: tables.categories.id,
							database
						})}`,

					totalRelatedTransactionCount: sql<number>`
						${queries.category.totalRelatedTransactionCount({
							categoryId: tables.categories.id,
							database
						})}`,

					totalRelatedTransactionSum: sql<number>`
						${queries.category.totalRelatedTransactionSum({
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
