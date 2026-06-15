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
		const found = db
			.select({
				currentTargetPercentage: sql<null | number>`
					CASE
						WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
						ELSE (
							COALESCE((
								SELECT sum(${tables.budgetAssignments.amount})
								FROM ${tables.budgetAssignments}
								WHERE ${tables.budgetAssignments.categoryId} = ${tables.categories.id}
								AND ${tables.budgetAssignments.month} <= ${month}
							), 0)
							+
							COALESCE((
								SELECT sum(${tables.transactions.amount})
								FROM ${tables.transactions}
								WHERE ${tables.transactions.categoryId} = ${tables.categories.id}
								AND strftime('%Y%m', ${tables.transactions.date}) <= ${String(month)}
							), 0)
						) * 100 / ${tables.categories.targetBalance}
					END`,
				pendingTransactionCount: sql<number>`
					COALESCE((
						SELECT count(*)
						FROM ${tables.transactions}
						WHERE ${tables.transactions.categoryId} = ${tables.categories.id}
						AND ${tables.transactions.validated} = false
					), 0)`,
				totalAssignedBudgetCount: sql<number>`
					COALESCE((
						SELECT count(*)
						FROM ${tables.budgetAssignments}
						WHERE ${tables.budgetAssignments.categoryId} = ${tables.categories.id}
					), 0)`,
				totalAssignedBudgetSum: sql<number>`
					COALESCE((
						SELECT sum(${tables.budgetAssignments.amount})
						FROM ${tables.budgetAssignments}
						WHERE ${tables.budgetAssignments.categoryId} = ${tables.categories.id}
					), 0)`,
				totalRelatedTransactionCount: sql<number>`
					COALESCE((
						SELECT count(*)
						FROM ${tables.transactions}
						WHERE ${tables.transactions.categoryId} = ${tables.categories.id}
					), 0)`,
				totalRelatedTransactionSum: sql<number>`
					COALESCE((
						SELECT sum(${tables.transactions.amount})
						FROM ${tables.transactions}
						WHERE ${tables.transactions.categoryId} = ${tables.categories.id}
					), 0)`
			})
			.from(tables.categories)
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
