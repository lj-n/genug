import { database, type Database, tables } from '$db';
import { createMonthParam } from '$lib/utils/date-utils';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, isNotNull, isNull, sql } from 'drizzle-orm';

import { accessGuard, hasAccess } from './access';
import { withOrder } from './utils';

const month = createMonthParam();

export const queries = (userId: string, db: Database = database) => ({
	all: (budgetId: string) => {
		const qb = db
			.select(getColumns(tables.categories))
			.from(tables.categories)
			.where(
				and(
					isNull(tables.categories.archivedAt),
					eq(tables.categories.budgetId, budgetId),
					hasAccess(tables.categories, userId, db)
				)
			)
			.groupBy(tables.categories.id)
			.$dynamic();

		return withOrder(qb, tables.categories, 'category', userId).all();
	},

	archived: (budgetId: string) => {
		return db
			.select(getColumns(tables.categories))
			.from(tables.categories)
			.where(
				and(
					isNotNull(tables.categories.archivedAt),
					eq(tables.categories.budgetId, budgetId),
					hasAccess(tables.categories, userId, db)
				)
			)
			.groupBy(tables.categories.id)
			.all();
	},

	byId: (id: string) => {
		const found = db
			.select(getColumns(tables.categories))
			.from(tables.categories)
			.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, id)))
			.groupBy(tables.categories.id)
			.get();

		if (!found) error(404);
		return found;
	},

	stats: (categoryId: string) => {
		const txAgg = db
			.select({
				categoryId: tables.transactions.categoryId,
				count: sql<number>`count(*)`.as('count'),
				pendingCount:
					sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = false THEN 1 ELSE 0 END), 0)`.as(
						'pendingCount'
					),
				sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`.as('sum'),
				sumUntilMonth:
					sql<number>`coalesce(sum(CASE WHEN strftime('%Y%m', ${tables.transactions.date}) <= ${String(month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
						'sumUntilMonth'
					)
			})
			.from(tables.transactions)
			.groupBy(tables.transactions.categoryId)
			.as('txAgg');

		const assignmentAgg = db
			.select({
				categoryId: tables.budgetAssignments.categoryId,
				count: sql<number>`count(*)`.as('count'),
				sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`.as('sum'),
				sumUntilMonth:
					sql<number>`coalesce(sum(CASE WHEN ${tables.budgetAssignments.month} <= ${month} THEN ${tables.budgetAssignments.amount} ELSE 0 END), 0)`.as(
						'sumUntilMonth'
					)
			})
			.from(tables.budgetAssignments)
			.groupBy(tables.budgetAssignments.categoryId)
			.as('assignmentAgg');

		const found = db
			.select({
				currentTargetPercentage: sql<null | number>`
					CASE
						WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
						ELSE (coalesce(${assignmentAgg.sumUntilMonth}, 0) + coalesce(${txAgg.sumUntilMonth}, 0)) * 100 / ${tables.categories.targetBalance}
					END`,
				pendingTransactionCount: sql<number>`coalesce(${txAgg.pendingCount}, 0)`,
				totalAssignedBudgetCount: sql<number>`coalesce(${assignmentAgg.count}, 0)`,
				totalAssignedBudgetSum: sql<number>`coalesce(${assignmentAgg.sum}, 0)`,
				totalRelatedTransactionCount: sql<number>`coalesce(${txAgg.count}, 0)`,
				totalRelatedTransactionSum: sql<number>`coalesce(${txAgg.sum}, 0)`
			})
			.from(tables.categories)
			.leftJoin(txAgg, eq(txAgg.categoryId, tables.categories.id))
			.leftJoin(assignmentAgg, eq(assignmentAgg.categoryId, tables.categories.id))
			.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, categoryId)))
			.get();

		if (!found) error(404);
		return found;
	}
});

export const commands = (userId: string, db: Database = database) => ({
	create: (budgetId: string, name: string) => {
		accessGuard(budgetId, userId, db);

		return db.transaction((tx) => {
			const category = tx.insert(tables.categories).values({ budgetId, name }).returning().get();

			tx.insert(tables.userEntityOrder)
				.values({ entityId: category.id, entityType: 'category', position: 0, userId })
				.run();

			return category;
		});
	},

	edit: (
		id: string,
		data: Partial<
			Pick<typeof tables.categories.$inferInsert, 'archivedAt' | 'name' | 'notes' | 'targetBalance'>
		>
	) => {
		const updated = db
			.update(tables.categories)
			.set(data)
			.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, id)))
			.returning()
			.get();

		if (!updated) error(404);
		return updated;
	},

	reorder: (orderedIds: string[]) => {
		db.transaction((tx) => {
			for (const [position, categoryId] of orderedIds.entries()) {
				tx.insert(tables.userEntityOrder)
					.values({ entityId: categoryId, entityType: 'category', position, userId })
					.onConflictDoUpdate({
						set: { position },
						target: [
							tables.userEntityOrder.userId,
							tables.userEntityOrder.entityType,
							tables.userEntityOrder.entityId
						]
					})
					.run();
			}
		});
	}
});
