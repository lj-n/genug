import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { addMonths, currentMonth, type Month } from '$lib/utils/month';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess } from './access';
import { categoryActivityByMonth, categoryBalances } from './envelope';
import { withOrder } from './utils';

/**
 * A category may be archived only when its all-time Remaining
 * is zero and it has no pending (unvalidated) transactions.
 */
const readArchivability = (userId: string, db: Database, categoryId: string) => {
	const bal = categoryBalances(db, currentMonth());

	const found = db
		.select({
			pendingTransactionCount: sql<number>`coalesce(${bal.pendingCount}, 0)`,
			remainingBalance: sql<number>`coalesce(${bal.allTimeRemaining}, 0)`
		})
		.from(tables.categories)
		.leftJoin(bal, eq(bal.categoryId, tables.categories.id))
		.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, categoryId)))
		.get();

	if (!found) error(404, m.error_category_not_found());
	return {
		archivable: found.pendingTransactionCount === 0 && found.remainingBalance === 0,
		...found
	};
};

/**
 * A category may be deleted only when its all-time Remaining is zero and no
 * transaction of any kind — pending or validated — references it. Strictly
 * stronger than archivability: Deletable ⟹ Archivable (see ADR-0008).
 */
const readDeletability = (userId: string, db: Database, categoryId: string) => {
	const bal = categoryBalances(db, currentMonth());

	const found = db
		.select({
			remainingBalance: sql<number>`coalesce(${bal.allTimeRemaining}, 0)`,
			transactionCount: sql<number>`coalesce(${bal.txCount}, 0)`
		})
		.from(tables.categories)
		.leftJoin(bal, eq(bal.categoryId, tables.categories.id))
		.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, categoryId)))
		.get();

	if (!found) error(404, m.error_category_not_found());
	return {
		deletable: found.transactionCount === 0 && found.remainingBalance === 0,
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

	deletability: (categoryId: string) => readDeletability(userId, db, categoryId),

	stats: (categoryId: string, month: Month) => {
		const bal = categoryBalances(db, month);

		const found = db
			.select({
				currentTargetPercentage: sql<null | number>`
					CASE
						WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
						ELSE coalesce(${bal.remaining}, 0) * 100 / ${tables.categories.targetBalance}
					END`,
				lastActivityDate: sql<null | string>`${bal.lastTransactionDate}`,
				pendingTransactionCount: sql<number>`coalesce(${bal.pendingCount}, 0)`,
				totalAssignedBudgetCount: sql<number>`coalesce(${bal.assignCount}, 0)`,
				totalAssignedBudgetSum: sql<number>`coalesce(${bal.allTimeAssignmentSum}, 0)`,
				totalRelatedTransactionCount: sql<number>`coalesce(${bal.txCount}, 0)`,
				totalRelatedTransactionSum: sql<number>`coalesce(${bal.allTimeTransactionSum}, 0)`
			})
			.from(tables.categories)
			.leftJoin(bal, eq(bal.categoryId, tables.categories.id))
			.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, categoryId)))
			.get();

		if (!found) error(404);

		// Spend is Activity negated for display (see CONTEXT.md); calendar
		// gaps read as zero.
		const activityByMonth = new Map(
			categoryActivityByMonth(db, categoryId).map((row) => [row.month, row.activity])
		);
		const spend = (m: Month) => {
			const activity = activityByMonth.get(m) ?? 0;
			return activity === 0 ? 0 : -activity;
		};

		const sparkline = Array.from({ length: 12 }, (_, i) => {
			const m = addMonths(month, i - 11);
			return { month: m, spend: spend(m) };
		});

		const monthSpend = spend(month);
		const previousMonthSpend = spend(addMonths(month, -1));
		const spendDelta = monthSpend - previousMonthSpend;

		// Trailing average over the six calendar months strictly before the
		// viewed month, zero months included — but the divisor never reaches
		// back before the category's first-ever activity month, so young
		// categories aren't diluted by pre-existence months. No activity
		// before the viewed month means no average at all.
		const firstActivityMonth = Math.min(...activityByMonth.keys());
		const averageWindow = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 6)).filter(
			(m) => m >= firstActivityMonth
		);
		const trailingAverageSpend =
			averageWindow.length === 0
				? null
				: Math.round(averageWindow.reduce((sum, m) => sum + spend(m), 0) / averageWindow.length);

		return {
			...found,
			monthSpend,
			previousMonthSpend,
			sparkline,
			spendDelta,
			trailingAverageSpend
		};
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

	delete: (id: string) =>
		db.transaction((tx) => {
			// better-sqlite3 serializes on a single connection, so reads
			// on `db` inside the transaction callback see the same
			// uncommitted state as `tx`.
			const state = readDeletability(userId, db, id);
			if (!state.deletable) error(400, m.error_category_not_deletable());

			const deleted = tx
				.delete(tables.categories)
				.where(and(hasAccess(tables.categories, userId, db), eq(tables.categories.id, id)))
				.returning()
				.get();

			if (!deleted) error(404, m.error_category_not_found());

			// `budget_assignments` rows fall away via ON DELETE CASCADE, but
			// `user_entity_order` keys on the category id without a cascade —
			// remove every user's ordering entry for this category ourselves
			// (see ADR-0008).
			tx.delete(tables.userEntityOrder)
				.where(
					and(
						eq(tables.userEntityOrder.entityType, 'category'),
						eq(tables.userEntityOrder.entityId, id)
					)
				)
				.run();

			return deleted;
		}),

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
