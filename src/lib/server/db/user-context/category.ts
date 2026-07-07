import { database, type Database, tables } from '$db';
import { dateIsOnOrBefore } from '$db/month-sql';
import { m } from '$lib/paraglide/messages';
import { currentMonth } from '$lib/utils/month';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess } from './access';
import { withOrder } from './utils';

/**
 * A category may be archived only when its remaining balance
 * (all-time assignments + transactions) is zero and it has no
 * pending (unvalidated) transactions.
 */
const readArchivability = (userId: string, db: Database, categoryId: string) => {
	const txAgg = db
		.select({
			categoryId: tables.transactions.categoryId,
			pendingCount:
				sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = false THEN 1 ELSE 0 END), 0)`.as(
					'pendingCount'
				),
			sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`.as('sum')
		})
		.from(tables.transactions)
		.groupBy(tables.transactions.categoryId)
		.as('txAgg');

	const assignmentAgg = db
		.select({
			categoryId: tables.budgetAssignments.categoryId,
			sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`.as('sum')
		})
		.from(tables.budgetAssignments)
		.groupBy(tables.budgetAssignments.categoryId)
		.as('assignmentAgg');

	const found = db
		.select({
			pendingTransactionCount: sql<number>`coalesce(${txAgg.pendingCount}, 0)`,
			remainingBalance: sql<number>`coalesce(${assignmentAgg.sum}, 0) + coalesce(${txAgg.sum}, 0)`
		})
		.from(tables.categories)
		.leftJoin(txAgg, eq(txAgg.categoryId, tables.categories.id))
		.leftJoin(assignmentAgg, eq(assignmentAgg.categoryId, tables.categories.id))
		.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, categoryId)))
		.get();

	if (!found) error(404, m.error_category_not_found());
	return {
		archivable: found.pendingTransactionCount === 0 && found.remainingBalance === 0,
		...found
	};
};

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

	archivability: (categoryId: string) => readArchivability(userId, db, categoryId),

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
		const month = currentMonth();

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
					sql<number>`coalesce(sum(CASE WHEN ${dateIsOnOrBefore(tables.transactions.date, month)} THEN ${tables.transactions.amount} ELSE 0 END), 0)`.as(
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
	archive: (id: string) =>
		db.transaction((tx) => {
			// better-sqlite3 serializes on a single connection, so reads
			// on `db` inside the transaction callback see the same
			// uncommitted state as `tx`.
			const state = readArchivability(userId, db, id);
			if (!state.archivable) error(400, m.error_category_not_archivable());

			const updated = tx
				.update(tables.categories)
				.set({ archivedAt: new Date() })
				.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, id)))
				.returning()
				.get();

			if (!updated) error(404, m.error_category_not_found());
			return updated;
		}),

	create: (budgetId: string, name: string) => {
		accessGuard(budgetId, userId, db);

		const duplicate = db
			.select({ id: tables.categories.id })
			.from(tables.categories)
			.where(and(eq(tables.categories.name, name), eq(tables.categories.budgetId, budgetId)))
			.get();
		if (duplicate) error(400, m.category_error_duplicate_name({ value: name }));

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
		data: Partial<Pick<typeof tables.categories.$inferInsert, 'name' | 'notes' | 'targetBalance'>>
	) => {
		if (data.name !== undefined) {
			const self = alias(tables.categories, 'self');
			const duplicate = db
				.select({ id: tables.categories.id })
				.from(tables.categories)
				.innerJoin(self, eq(self.budgetId, tables.categories.budgetId))
				.where(
					and(
						hasAccess(tables.categories, userId, db),
						eq(self.id, id),
						eq(tables.categories.name, data.name),
						ne(tables.categories.id, id)
					)
				)
				.get();
			if (duplicate) error(400, m.category_error_duplicate_name({ value: data.name }));
		}

		// a target balance of 0 means "no target" and is stored as null
		const updated = db
			.update(tables.categories)
			.set({
				name: data.name,
				notes: data.notes,
				targetBalance: data.targetBalance === undefined ? undefined : data.targetBalance || null
			})
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
	},

	restore: (id: string) => {
		const updated = db
			.update(tables.categories)
			.set({ archivedAt: null })
			.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, id)))
			.returning()
			.get();

		if (!updated) error(404, m.error_category_not_found());
		return updated;
	}
});
