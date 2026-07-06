import { database, type Database, tables } from '$db';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess, ownerGuard } from './access';
import { withOrder } from './utils';

export type BudgetUser = {
	id: string;
	name: string;
	role: typeof tables.usersToBudgets.$inferSelect.role;
};

export const queries = (userId: string, db: Database = database) => ({
	all: () => {
		const qb = db
			.select(getColumns(tables.budgets))
			.from(tables.budgets)
			.where(hasAccess(tables.budgets, userId, db))
			.$dynamic();
		return withOrder(qb, tables.budgets, 'budget', userId).all();
	},

	byId: (id: string) => {
		const found = db
			.select(getColumns(tables.budgets))
			.from(tables.budgets)
			.where(and(hasAccess(tables.budgets, userId, db), eq(tables.budgets.id, id)))
			.get();
		if (!found) error(404);
		return found;
	},

	eligibleUsers: (budgetId: string) => {
		return db
			.select({
				id: tables.users.id,
				name: tables.users.username
			})
			.from(tables.users)
			.leftJoin(
				tables.usersToBudgets,
				and(
					eq(tables.usersToBudgets.userId, tables.users.id),
					eq(tables.usersToBudgets.budgetId, budgetId)
				)
			)
			.where(isNull(tables.usersToBudgets.userId))
			.all();
	},

	invitations: () => {
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
				and(
					eq(inviterAlias.budgetId, tables.usersToBudgets.budgetId),
					eq(inviterAlias.role, 'OWNER')
				)
			)
			.innerJoin(inviterUserAlias, eq(inviterUserAlias.id, inviterAlias.userId))
			.innerJoin(tables.budgets, eq(tables.budgets.id, tables.usersToBudgets.budgetId))
			.where(
				and(eq(tables.usersToBudgets.userId, userId), eq(tables.usersToBudgets.role, 'INVITEE'))
			)
			.all();
	},

	monthly: (budgetId: string, month: number) => {
		const transactionAgg = db
			.select({
				activity: sql<number>`
				    coalesce(sum(
                        CASE WHEN 
                            strftime('%Y%m', ${tables.transactions.date}) = ${String(month)}
					    THEN ${tables.transactions.amount} 
                        ELSE 0 
                        END
                    ), 0)`.as('activity'),
				categoryId: tables.transactions.categoryId,
				sum: sql<number>`
				    coalesce(sum(
                        CASE WHEN 
                            strftime('%Y%m', ${tables.transactions.date}) <= ${String(month)}
                        THEN ${tables.transactions.amount} 
                        ELSE 0 
                        END
                    ), 0)`.as('sum')
			})
			.from(tables.transactions)
			.groupBy(tables.transactions.categoryId)
			.as('transactionAgg');

		const assignmentAgg = db
			.select({
				categoryId: tables.budgetAssignments.categoryId,
				sum: sql<number>`
				    coalesce(sum(
                        CASE WHEN 
                            ${tables.budgetAssignments.month} <= ${month}
                        THEN ${tables.budgetAssignments.amount} 
                        ELSE 0 
                        END
                    ), 0)`.as('sum')
			})
			.from(tables.budgetAssignments)
			.groupBy(tables.budgetAssignments.categoryId)
			.as('assignmentAgg');

		const qb = db
			.select({
				...getColumns(tables.categories),
				activity: sql<number>`coalesce(${transactionAgg.activity}, 0)`,
				assigned: sql<number>`coalesce(${tables.budgetAssignments.amount}, 0)`,
				remaining: sql<number>`
                    coalesce(${assignmentAgg.sum}, 0) 
                    + coalesce(${transactionAgg.sum}, 0)`
			})
			.from(tables.categories)
			.leftJoin(
				tables.budgetAssignments,
				and(
					eq(tables.budgetAssignments.categoryId, tables.categories.id),
					eq(tables.budgetAssignments.month, month)
				)
			)
			.leftJoin(transactionAgg, eq(transactionAgg.categoryId, tables.categories.id))
			.leftJoin(assignmentAgg, eq(assignmentAgg.categoryId, tables.categories.id))
			.where(
				and(
					isNull(tables.categories.archivedAt),
					eq(tables.categories.budgetId, budgetId),
					hasAccess(tables.categories, userId, db)
				)
			)
			.$dynamic();

		return withOrder(qb, tables.categories, 'budget', userId).all();
	},

	unassigned: (budgetId: string) => {
		const assignmentSum = db
			.select({
				budgetId: tables.budgetAssignments.budgetId,
				sum: sql<number>`coalesce(sum(${tables.budgetAssignments.amount}), 0)`.as('sum')
			})
			.from(tables.budgetAssignments)
			.groupBy(tables.budgetAssignments.budgetId)
			.as('assignSum');

		const incomeSum = db
			.select({
				budgetId: tables.transactions.budgetId,
				sum: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`.as('sum')
			})
			.from(tables.transactions)
			.where(isNull(tables.transactions.categoryId))
			.groupBy(tables.transactions.budgetId)
			.as('incomeSum');

		const result = db
			.select({
				sum: sql<number>`coalesce(${incomeSum.sum}, 0) - coalesce(${assignmentSum.sum}, 0)`
			})
			.from(tables.budgets)
			.leftJoin(assignmentSum, eq(assignmentSum.budgetId, tables.budgets.id))
			.leftJoin(incomeSum, eq(incomeSum.budgetId, tables.budgets.id))
			.where(and(eq(tables.budgets.id, budgetId), hasAccess(tables.budgets, userId, db)))
			.get();

		return result?.sum ?? 0;
	},

	users: (budgetId: string) => {
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
					hasAccess(tables.usersToBudgets, userId, db)
				)
			)
			.orderBy(
				sql`CASE ${tables.usersToBudgets.role} 
                    WHEN 'OWNER' THEN 1 
                    WHEN 'MEMBER' THEN 2 
                    WHEN 'INVITEE' THEN 3 
                    END`
			)
			.all();
	}
});

export const commands = (userId: string, db: Database = database) => ({
	acceptInvite: (budgetId: string) => {
		db.update(tables.usersToBudgets)
			.set({ role: 'MEMBER' })
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					eq(tables.usersToBudgets.budgetId, budgetId),
					eq(tables.usersToBudgets.role, 'INVITEE')
				)
			)
			.run();
	},

	assignment: (data: typeof tables.budgetAssignments.$inferInsert) => {
		accessGuard(data.budgetId, userId, db);
		db.insert(tables.budgetAssignments)
			.values(data)
			.onConflictDoUpdate({
				set: { amount: data.amount },
				target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
			})
			.run();
	},

	create: (data: typeof tables.budgets.$inferInsert) => {
		return db.transaction((tx) => {
			const { id: budgetId } = tx.insert(tables.budgets).values(data).returning().get();
			tx.insert(tables.usersToBudgets).values({ budgetId, role: 'OWNER', userId }).run();
			return budgetId;
		});
	},

	edit: (budgetId: string, data: Pick<typeof tables.budgets.$inferInsert, 'currency' | 'name'>) => {
		ownerGuard(budgetId, userId, db);
		const updated = db
			.update(tables.budgets)
			.set(data)
			.where(eq(tables.budgets.id, budgetId))
			.returning()
			.get();

		if (!updated) error(404);
		return updated;
	},

	invite: (budgetId: string, inviteeId: string) => {
		ownerGuard(budgetId, userId, db);
		db.insert(tables.usersToBudgets).values({ budgetId, role: 'INVITEE', userId: inviteeId }).run();
	},

	removeUser: (budgetId: string, removeUserId: string) => {
		const isSelfRemoval = userId === removeUserId;
		if (!isSelfRemoval) ownerGuard(budgetId, userId, db);
		db.delete(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.budgetId, budgetId),
					eq(tables.usersToBudgets.userId, removeUserId)
				)
			)
			.run();
	},

	reorder: (orderedIds: string[]) => {
		db.transaction((tx) => {
			for (const [position, entityId] of orderedIds.entries()) {
				tx.insert(tables.userEntityOrder)
					.values({
						entityId,
						entityType: 'budget',
						position,
						userId
					})
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

	/**
	 * Moves an assigned amount from one category to another within the same budget/month.
	 * When `targetCategoryId` is `null`, the amount is returned to unassigned.
	 * A negative amount reverses direction (from → to means to → from).
	 */
	transferAssignment: ({
		amount,
		budgetId,
		month,
		sourceCategoryId,
		targetCategoryId
	}: {
		amount: number;
		budgetId: string;
		month: number;
		sourceCategoryId: string;
		targetCategoryId: null | string;
	}) => {
		accessGuard(budgetId, userId, db);

		if (sourceCategoryId === targetCategoryId) error(400);

		if (targetCategoryId === null) {
			db.insert(tables.budgetAssignments)
				.values({
					amount: -amount,
					budgetId,
					categoryId: sourceCategoryId,
					month
				})
				.onConflictDoUpdate({
					set: { amount: sql`${tables.budgetAssignments.amount} - ${amount}` },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.run();
			return;
		}

		db.transaction((tx) => {
			tx.insert(tables.budgetAssignments)
				.values({
					amount: -amount,
					budgetId,
					categoryId: sourceCategoryId,
					month
				})
				.onConflictDoUpdate({
					set: { amount: sql`${tables.budgetAssignments.amount} - ${amount}` },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.run();

			tx.insert(tables.budgetAssignments)
				.values({
					amount,
					budgetId,
					categoryId: targetCategoryId,
					month
				})
				.onConflictDoUpdate({
					set: { amount: sql`${tables.budgetAssignments.amount} + ${amount}` },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.run();
		});
	}
});
