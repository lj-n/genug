import { tables } from '$db';
import { and, asc, eq, getColumns, inArray, isNull, sql } from 'drizzle-orm';

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
		all() {
			return database
				.select(getColumns(tables.budgets))
				.from(tables.budgets)
				.leftJoin(
					tables.userEntityOrder,
					and(
						eq(tables.userEntityOrder.entityId, tables.budgets.id),
						eq(tables.userEntityOrder.entityType, 'budget'),
						eq(tables.userEntityOrder.userId, user.id)
					)
				)
				.orderBy(
					sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
					asc(tables.userEntityOrder.position),
					asc(tables.budgets.createdAt),
					asc(tables.budgets.id)
				)
				.where(
					userHasPermission({
						budgetIdCol: tables.budgets.id,
						database,
						userId: user.id
					})
				)
				.all();
		},

		create({ name }: { name: string }) {
			return database.transaction((tx) => {
				const budget = tx
					.insert(tables.budgets)
					.values({
						name
					})
					.returning()
					.get();

				tx.insert(tables.usersToBudgets)
					.values({
						budgetId: budget.id,
						role: 'OWNER',
						userId: user.id
					})
					.execute();

				return budget;
			});
		},

		/**
		 * Retrieves all categories for a given budget and month, along with various aggregated data such as activity, assigned budget, and related transactions.
		 */
		month({ budgetId, month }: { budgetId: string; month: number }) {
			return database
				.select({
					...getColumns(tables.categories),

					currentTargetPercentage: sql<null | number>`
						CASE
							WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
							ELSE (${queries.category.thisMonthRemaining({
								categoryId: tables.categories.id,
								database,
								month
							})}) * 100 / ${tables.categories.targetBalance}
						END`,

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
				.leftJoin(
					tables.userEntityOrder,
					and(
						eq(tables.userEntityOrder.entityId, tables.categories.id),
						eq(tables.userEntityOrder.entityType, 'category'),
						eq(tables.userEntityOrder.userId, user.id)
					)
				)
				.where(
					and(
						isNull(tables.categories.archivedAt),
						eq(tables.categories.budgetId, budgetId),
						userHasPermission({
							budgetIdCol: tables.categories.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.orderBy(
					sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
					asc(tables.userEntityOrder.position),
					asc(tables.categories.createdAt),
					asc(tables.categories.id)
				)
				.all();
		},

		reorder({ orderedIds }: { orderedIds: string[] }) {
			const availableBudgetIds = database
				.select({ id: tables.budgets.id })
				.from(tables.budgets)
				.where(
					and(
						inArray(tables.budgets.id, orderedIds),
						userHasPermission({
							budgetIdCol: tables.budgets.id,
							database,
							userId: user.id
						})
					)
				)
				.all();

			if (availableBudgetIds.length !== orderedIds.length) {
				throw new Error('Invalid budget ids');
			}

			database.transaction((tx) => {
				for (const [position, budgetId] of orderedIds.entries()) {
					tx.insert(tables.userEntityOrder)
						.values({
							entityId: budgetId,
							entityType: 'budget',
							position,
							userId: user.id
						})
						.onConflictDoUpdate({
							set: { position },
							target: [
								tables.userEntityOrder.userId,
								tables.userEntityOrder.entityType,
								tables.userEntityOrder.entityId
							]
						})
						.execute();
				}
			});
		}
	};
}
