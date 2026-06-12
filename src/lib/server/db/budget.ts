import { database, type Database, tables } from '$db';
import { and, asc, eq, getColumns, inArray, isNull, notExists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import * as budgetQueries from './budget.utils';
import { orderByRole, userHasRole } from './budget.utils';
import * as categoryQueries from './category.utils';

export function acceptBudgetInvite({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	const member = db
		.update(tables.usersToBudgets)
		.set({ role: 'MEMBER' })
		.where(
			and(
				userHasRole('INVITEE', tables.usersToBudgets.budgetId, userId),
				eq(tables.usersToBudgets.budgetId, budgetId)
			)
		)
		.returning()
		.get();

	if (!member) throw new Error();
}

export function assignBudget({
	amount,
	budgetId,
	categoryId,
	db = database,
	month,
	userId
}: {
	amount: number;
	budgetId: string;
	categoryId: string;
	db?: Database;
	month: number;
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

		return tx
			.insert(tables.budgetAssignments)
			.values({ amount, budgetId, categoryId, month })
			.onConflictDoUpdate({
				set: { amount },
				target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
			})
			.returning()
			.get();
	});
}

export function createBudget({
	data,
	db = database,
	userId
}: {
	data: typeof tables.budgets.$inferInsert;
	db?: Database;
	userId: string;
}) {
	return db.transaction((tx) => {
		const budget = tx.insert(tables.budgets).values(data).returning().get();

		tx.insert(tables.usersToBudgets)
			.values({
				budgetId: budget.id,
				role: 'OWNER',
				userId: userId
			})
			.execute();

		return budget;
	});
}

export function getAllBudgets({ db = database, userId }: { db?: Database; userId: string }) {
	return db
		.select(getColumns(tables.budgets))
		.from(tables.budgets)
		.leftJoin(
			tables.userEntityOrder,
			and(
				eq(tables.userEntityOrder.entityId, tables.budgets.id),
				eq(tables.userEntityOrder.entityType, 'budget'),
				eq(tables.userEntityOrder.userId, userId)
			)
		)
		.orderBy(
			sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
			asc(tables.userEntityOrder.position),
			asc(tables.budgets.createdAt),
			asc(tables.budgets.id)
		)
		.where(userHasRole('MEMBER', tables.budgets.id, userId))
		.all();
}

export function getBudgetById({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	return db
		.select(getColumns(tables.budgets))
		.from(tables.budgets)
		.where(
			and(eq(tables.budgets.id, budgetId), userHasRole('MEMBER', tables.budgets.id, userId, db))
		)
		.get();
}

export function getBudgetInvitations({ db = database, userId }: { db?: Database; userId: string }) {
	const inviterAlias = alias(tables.usersToBudgets, 'inviter_utb');
	const inviterUserAlias = alias(tables.users, 'inviter_user');

	return db
		.select({
			budgetId: tables.usersToBudgets.budgetId,
			budgetName: tables.budgets.name,
			inviterName: inviterUserAlias.username
		})
		.from(tables.usersToBudgets)
		.innerJoin(
			inviterAlias,
			and(eq(inviterAlias.budgetId, tables.usersToBudgets.budgetId), eq(inviterAlias.role, 'OWNER'))
		)
		.innerJoin(inviterUserAlias, eq(inviterUserAlias.id, inviterAlias.userId))
		.leftJoin(tables.budgets, eq(tables.budgets.id, tables.usersToBudgets.budgetId))
		.where(and(eq(tables.usersToBudgets.userId, userId), eq(tables.usersToBudgets.role, 'INVITEE')))
		.all();
}

export function getBudgetMonth({
	budgetId,
	db = database,
	month,
	userId
}: {
	budgetId: string;
	db?: Database;
	month: number;
	userId: string;
}) {
	return db
		.select({
			...getColumns(tables.categories),

			currentTargetPercentage: sql<null | number>`
				CASE
					WHEN ${tables.categories.targetBalance} IS NULL THEN NULL
					ELSE (${categoryQueries.thisMonthRemaining({
						categoryId: tables.categories.id,
						database: db,
						month
					})}) * 100 / ${tables.categories.targetBalance}
				END`,

			pendingTransactionCount: sql<number>`
				${categoryQueries.pendingTransactionCount({
					categoryId: tables.categories.id,
					database: db
				})}`,

			thisMonthActivity: sql<number>`
				${categoryQueries.thisMonthActivity({
					categoryId: tables.categories.id,
					database: db,
					month
				})}`,

			thisMonthAmount: sql<number>`coalesce(${tables.budgetAssignments.amount}, 0)`,

			thisMonthRemaining: sql<number>`
				${categoryQueries.thisMonthRemaining({
					categoryId: tables.categories.id,
					database: db,
					month
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
		.orderBy(
			sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
			asc(tables.userEntityOrder.position),
			asc(tables.categories.createdAt),
			asc(tables.categories.id)
		)
		.all();
}

export function getBudgetUnassigned({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	return db
		.select({
			sum: sql<number>`
				${budgetQueries.totalSumOfIncome({ budgetId: tables.budgets.id, database: db })}
				-
				${budgetQueries.totalSumOfAssingments({ budgetId: tables.budgets.id, database: db })}
			`
		})
		.from(tables.budgets)
		.where(
			and(eq(tables.budgets.id, budgetId), userHasRole('MEMBER', tables.budgets.id, userId, db))
		)
		.get();
}

export function getBudgetUsers({
	budgetId,
	db = database,
	userId
}: {
	budgetId: string;
	db?: Database;
	userId: string;
}) {
	return db
		.select({
			id: tables.users.id,
			name: tables.users.username,
			role: tables.usersToBudgets.role
		})
		.from(tables.usersToBudgets)
		.innerJoin(tables.users, eq(tables.users.id, tables.usersToBudgets.userId))
		.where(
			and(
				eq(tables.usersToBudgets.budgetId, budgetId),
				userHasRole('MEMBER', tables.usersToBudgets.budgetId, userId)
			)
		)
		.orderBy(orderByRole(tables.usersToBudgets.role))
		.all();
}

export function getEligibleUsers({ budgetId, db = database }: { budgetId: string; db?: Database }) {
	return db
		.select({
			id: tables.users.id,
			name: tables.users.username
		})
		.from(tables.users)
		.where(
			notExists(
				database
					.select()
					.from(tables.usersToBudgets)
					.where(
						and(
							eq(tables.usersToBudgets.userId, tables.users.id),
							eq(tables.usersToBudgets.budgetId, budgetId)
						)
					)
			)
		)
		.all();
}

export function inviteBudgetUser({
	budgetId,
	db = database,
	inviteeName,
	userId
}: {
	budgetId: string;
	db?: Database;
	inviteeName: string;
	userId: string;
}) {
	db.transaction((tx) => {
		const owner = tx
			.select({ role: tables.usersToBudgets.role })
			.from(tables.usersToBudgets)
			.where(userHasRole('OWNER', tables.usersToBudgets.budgetId, userId))
			.get();

		if (!owner) throw new Error();

		const invitee = tx
			.select()
			.from(tables.users)
			.where(eq(tables.users.username, inviteeName))
			.get();

		if (!invitee) throw new Error();

		tx.insert(tables.usersToBudgets)
			.values({
				budgetId,
				role: 'INVITEE',
				userId: invitee.id
			})
			.run();
	});
}

export function removeBudgetUser({
	budgetId,
	db = database,
	userId,
	userIdToRemove
}: {
	budgetId: string;
	db?: Database;
	userId: string;
	userIdToRemove: string;
}) {
	const isSelfRemoval = userId === userIdToRemove;

	db.delete(tables.usersToBudgets)
		.where(
			and(
				eq(tables.usersToBudgets.budgetId, budgetId),
				eq(tables.usersToBudgets.userId, userIdToRemove),
				userHasRole(isSelfRemoval ? 'INVITEE' : 'OWNER', tables.usersToBudgets.budgetId, userId)
			)
		)
		.run();
}

export function reorderBudgets({
	db = database,
	orderedIds,
	userId
}: {
	db?: Database;
	orderedIds: string[];
	userId: string;
}) {
	const availableBudgetIds = db
		.select({ id: tables.budgets.id })
		.from(tables.budgets)
		.where(
			and(
				inArray(tables.budgets.id, orderedIds),
				userHasRole('MEMBER', tables.budgets.id, userId, db)
			)
		)
		.all();

	if (availableBudgetIds.length !== orderedIds.length) {
		throw new Error('Invalid budget ids');
	}

	db.transaction((tx) => {
		for (const [position, budgetId] of orderedIds.entries()) {
			tx.insert(tables.userEntityOrder)
				.values({ entityId: budgetId, entityType: 'budget', position, userId })
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

export function setBudget({
	budgetId,
	data,
	db = database,
	userId
}: {
	budgetId: string;
	data: typeof tables.budgets.$inferInsert;
	db?: Database;
	userId: string;
}) {
	const budget = db
		.update(tables.budgets)
		.set(data)
		.where(and(userHasRole('OWNER', tables.budgets.id, userId), eq(tables.budgets.id, budgetId)))
		.returning()
		.get();

	if (!budget) throw new Error();
}

export function transferBudget({
	amount,
	budgetId,
	db = database,
	fromCategoryId,
	month,
	toCategoryId,
	userId
}: {
	amount: number;
	budgetId: string;
	db?: Database;
	fromCategoryId: null | string;
	month: number;
	toCategoryId: string;
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

		if (fromCategoryId !== null) {
			const fromCurrent = tx
				.select({ amount: tables.budgetAssignments.amount })
				.from(tables.budgetAssignments)
				.where(
					and(
						eq(tables.budgetAssignments.categoryId, fromCategoryId),
						eq(tables.budgetAssignments.month, month)
					)
				)
				.get();

			const fromNewAmount = (fromCurrent?.amount ?? 0) - amount;

			tx.insert(tables.budgetAssignments)
				.values({ amount: fromNewAmount, budgetId, categoryId: fromCategoryId, month })
				.onConflictDoUpdate({
					set: { amount: fromNewAmount },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.execute();
		}

		const toCurrent = tx
			.select({ amount: tables.budgetAssignments.amount })
			.from(tables.budgetAssignments)
			.where(
				and(
					eq(tables.budgetAssignments.categoryId, toCategoryId),
					eq(tables.budgetAssignments.month, month)
				)
			)
			.get();

		const toNewAmount = (toCurrent?.amount ?? 0) + amount;

		return tx
			.insert(tables.budgetAssignments)
			.values({ amount: toNewAmount, budgetId, categoryId: toCategoryId, month })
			.onConflictDoUpdate({
				set: { amount: toNewAmount },
				target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
			})
			.returning()
			.get();
	});
}
