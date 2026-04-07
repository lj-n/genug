import { tables } from '$db';
import { and, eq, getColumns, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';
import queries from './queries';

const selectColumns = (database: App.Database) => ({
	...getColumns(tables.categories),

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
		async all() {
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
				.groupBy(tables.categories.id);
		},

		async getById({ id }: { id: string }) {
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

		async update({
			data,
			id
		}: {
			data: Pick<
				typeof tables.categories.$inferInsert,
				'archived_at' | 'name' | 'notes' | 'targetBalance'
			>;
			id: string;
		}) {
			const [updated] = await database
				.update(tables.categories)
				.set(data)
				.where(eq(tables.categories.id, id))
				.returning();

			return updated;
		}
	};
}
