import { database, type Database, tables } from '$db';
import { createMonthParam } from '$lib/utils/date-utils';
import { and, asc, eq, getColumns, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { userHasRole } from './budget.utils';
import * as categoryQueries from './category.utils';

export function createCategory({
	budgetId,
	db = database,
	name,
	userId
}: {
	budgetId: string;
	db?: Database;
	name: string;
	userId: string;
}) {
	return db.transaction((tx) => {
		const budget = tx
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(
				and(eq(tables.budgets.id, budgetId), userHasRole('MEMBER', tables.budgets.id, userId, db))
			)
			.get();

		if (!budget) throw new Error('Budget not found');

		const category = tx.insert(tables.categories).values({ budgetId, name }).returning().get();

		tx.insert(tables.userEntityOrder)
			.values({ entityId: category.id, entityType: 'category', position: 0, userId })
			.run();

		return category;
	});
}

export function getAllCategories({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	return db
		.select(selectColumns(db))
		.from(tables.categories)
		.leftJoin(
			tables.userEntityOrder,
			and(
				eq(tables.userEntityOrder.entityId, tables.categories.id),
				eq(tables.userEntityOrder.entityType, 'category'),
				eq(tables.userEntityOrder.userId, userId)
			)
		)
		.where(
			and(
				isNull(tables.categories.archivedAt),
				eq(tables.categories.budgetId, budgetId),
				userHasRole('MEMBER', tables.categories.budgetId, userId, db)
			)
		)
		.groupBy(tables.categories.id)
		.orderBy(
			sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
			asc(tables.userEntityOrder.position),
			asc(tables.categories.createdAt),
			asc(tables.categories.id)
		)
		.all();
}

export function getAllCategoriesFlat({
	budgetId,
	db = database,
	userId
}: {
	budgetId?: string;
	db?: Database;
	userId: string;
}) {
	let dq = db
		.select(getColumns(tables.categories))
		.from(tables.categories)
		.where(userHasRole('MEMBER', tables.categories.budgetId, userId, db))
		.$dynamic();

	if (budgetId) {
		dq = dq.where(eq(tables.categories.budgetId, budgetId));
	}

	return dq.all();
}

export function getArchivedCategories({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	return db
		.select(selectColumns(db))
		.from(tables.categories)
		.where(
			and(
				isNotNull(tables.categories.archivedAt),
				eq(tables.categories.budgetId, budgetId),
				userHasRole('MEMBER', tables.categories.budgetId, userId, db)
			)
		)
		.groupBy(tables.categories.id)
		.all();
}

export function getCategoryById({
	db = database,
	id,
	userId
}: {
	db?: Database;
	id: string;
	userId: string;
}) {
	return db
		.select(selectColumns(db))
		.from(tables.categories)
		.where(
			and(
				eq(tables.categories.id, id),
				userHasRole('MEMBER', tables.categories.budgetId, userId, db)
			)
		)
		.groupBy(tables.categories.id)
		.get();
}

export function getCategoryMonthActivity({
	categoryId,
	db = database,
	month,
	userId
}: {
	categoryId: string;
	db?: Database;
	month: string;
	userId: string;
}) {
	return db
		.select(getColumns(tables.transactions))
		.from(tables.transactions)
		.where(
			and(
				userHasRole('MEMBER', tables.transactions.budgetId, userId, db),
				eq(tables.transactions.categoryId, categoryId),
				eq(sql`strftime('%Y%m', ${tables.transactions.date})`, month)
			)
		)
		.all();
}

export function reorderCategories({
	db = database,
	orderedIds,
	userId
}: {
	db?: Database;
	orderedIds: string[];
	userId: string;
}) {
	const availableCategoryIds = db
		.select({ id: tables.categories.id })
		.from(tables.categories)
		.where(
			and(
				inArray(tables.categories.id, orderedIds),
				isNull(tables.categories.archivedAt),
				userHasRole('MEMBER', tables.categories.budgetId, userId, db)
			)
		)
		.all();

	if (availableCategoryIds.length !== orderedIds.length) {
		throw new Error('Invalid category ids');
	}

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
				.execute();
		}
	});
}

export function updateCategory({
	data,
	db = database,
	id
}: {
	data: Partial<
		Pick<typeof tables.categories.$inferInsert, 'archivedAt' | 'name' | 'notes' | 'targetBalance'>
	>;
	db?: Database;
	id: string;
}) {
	return db
		.update(tables.categories)
		.set(data)
		.where(eq(tables.categories.id, id))
		.returning()
		.get();
}

function selectColumns(db: Database) {
	return {
		...getColumns(tables.categories),

		currentTargetPercentage: sql<null | number>`
			CASE
				WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
				ELSE (${categoryQueries.thisMonthRemaining({
					categoryId: tables.categories.id,
					database: db,
					month: createMonthParam()
				})}) * 100 / ${tables.categories.targetBalance}
			END`,

		pendingTransactionCount: sql<number>`
			${categoryQueries.pendingTransactionCount({
				categoryId: tables.categories.id,
				database: db
			})}`,

		totalAssignedBudgetCount: sql<number>`
			${categoryQueries.totalAssignedBudgetCount({
				categoryId: tables.categories.id,
				database: db
			})}`,

		totalAssignedBudgetSum: sql<number>`
			${categoryQueries.totalAssignedBudget({
				categoryId: tables.categories.id,
				database: db
			})}`,

		totalRelatedTransactionCount: sql<number>`
			${categoryQueries.totalRelatedTransactionCount({
				categoryId: tables.categories.id,
				database: db
			})}`,

		totalRelatedTransactionSum: sql<number>`
			${categoryQueries.totalRelatedTransactionSum({
				categoryId: tables.categories.id,
				database: db
			})}`
	};
}
