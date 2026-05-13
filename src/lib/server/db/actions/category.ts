import { tables } from '$db';
import { createMonthParam } from '$lib/utils/date-utils';
import { and, eq, getColumns, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';
import queries from './queries';

const selectColumns = (database: App.Database) => ({
	...getColumns(tables.categories),

	currentTargetPercentage: sql<null | number>`
		CASE
			WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
			ELSE (${queries.category.thisMonthRemaining({
				categoryId: tables.categories.id,
				database,
				month: createMonthParam()
			})}) * 100 / ${tables.categories.targetBalance}
		END`,

	pendingTransactionCount: sql<number>`
		${queries.category.pendingTransactionCount({
			categoryId: tables.categories.id,
			database
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
});

export function createCategoryActions({
	database,
	user
}: {
	database: App.Database;
	user: App.User;
}) {
	return {
		all() {
			return database
				.select(selectColumns(database))
				.from(tables.categories)
				.where(
					userHasPermission({
						budgetIdCol: tables.categories.budgetId,
						database,
						userId: user.id
					})
				)
				.groupBy(tables.categories.id)
				.all();
		},

		allFlat({ budgetId }: { budgetId?: string }) {
			let dq = database
				.select(getColumns(tables.categories))
				.from(tables.categories)
				.where(
					userHasPermission({
						budgetIdCol: tables.categories.budgetId,
						database,
						userId: user.id
					})
				)
				.$dynamic();

			if (budgetId) {
				dq = dq.where(eq(tables.categories.budgetId, budgetId));
			}

			return dq.all();
		},

		archived({ budgetId }: { budgetId: string }) {
			return database
				.select(selectColumns(database))
				.from(tables.categories)
				.where(
					and(
						isNotNull(tables.categories.archivedAt),
						eq(tables.categories.budgetId, budgetId),
						userHasPermission({
							budgetIdCol: tables.categories.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.groupBy(tables.categories.id)
				.all();
		},

		create({ budgetId, name }: { budgetId: string; name: string }) {
			return database.transaction((tx) => {
				const budget = tx
					.select({ id: tables.budgets.id })
					.from(tables.budgets)
					.where(
						and(
							eq(tables.budgets.id, budgetId),
							userHasPermission({
								budgetIdCol: tables.budgets.id,
								database,
								userId: user.id
							})
						)
					)
					.get();

				if (!budget) {
					throw new Error('Budget not found');
				}

				const category = tx.insert(tables.categories).values({ budgetId, name }).returning().get();

				tx.insert(tables.userEntityOrder)
					.values({
						entityId: category.id,
						entityType: 'category',
						position: 0,
						userId: user.id
					})
					.execute();

				return category;
			});
		},

		getById({ id }: { id: string }) {
			return database
				.select(selectColumns(database))
				.from(tables.categories)
				.where(
					and(
						eq(tables.categories.id, id),
						userHasPermission({
							budgetIdCol: tables.categories.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.get();
		},

		/**
		 * Retrieves all transactions related to a specific category for a given month, including details such as amount, date, and description.
		 */
		monthActivity({ categoryId, month }: { categoryId: string; month: string }) {
			return database
				.select(getColumns(tables.transactions))
				.from(tables.transactions)
				.where(
					and(
						userHasPermission({
							budgetIdCol: tables.transactions.budgetId,
							database,
							userId: user.id
						}),
						eq(tables.transactions.categoryId, categoryId),
						eq(sql`strftime('%Y%m', ${tables.transactions.date})`, month)
					)
				)
				.all();
		},

		reorder({ orderedIds }: { orderedIds: string[] }) {
			const availableCategoryIds = database
				.select({ id: tables.categories.id })
				.from(tables.categories)
				.where(
					and(
						inArray(tables.categories.id, orderedIds),
						isNull(tables.categories.archivedAt),
						userHasPermission({
							budgetIdCol: tables.categories.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.all();

			if (availableCategoryIds.length !== orderedIds.length) {
				console.log('wums');
				throw new Error('Invalid category ids');
			}

			database.transaction((tx) => {
				for (const [position, categoryId] of orderedIds.entries()) {
					tx.insert(tables.userEntityOrder)
						.values({
							entityId: categoryId,
							entityType: 'category',
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
		},

		update({
			data,
			id
		}: {
			data: Partial<
				Pick<
					typeof tables.categories.$inferInsert,
					'archivedAt' | 'name' | 'notes' | 'targetBalance'
				>
			>;
			id: string;
		}) {
			return database
				.update(tables.categories)
				.set(data)
				.where(eq(tables.categories.id, id))
				.returning()
				.get();
		}
	};
}
