import { tables } from '$db';
import { and, asc, eq, getColumns, inArray, isNull, notExists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

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
		acceptInvite({ budgetId }: { budgetId: string }) {
			const result = database
				.update(tables.usersToBudgets)
				.set({ role: 'MEMBER' })
				.where(
					and(
						eq(tables.usersToBudgets.budgetId, budgetId),
						eq(tables.usersToBudgets.userId, user.id),
						eq(tables.usersToBudgets.role, 'INVITEE')
					)
				)
				.returning()
				.get();

			if (!result) {
				throw new Error('No pending invitation found');
			}

			return result;
		},

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

		assign({
			amount,
			budgetId,
			categoryId,
			month
		}: {
			amount: number;
			budgetId: string;
			categoryId: string;
			month: number;
		}) {
			return database.transaction((tx) => {
				const budget = tx
					.select()
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
					);

				if (!budget) {
					throw new Error('Budget not found');
				}

				return tx
					.insert(tables.budgetAssignments)
					.values({
						amount,
						budgetId,
						categoryId,
						month
					})
					.onConflictDoUpdate({
						set: { amount },
						target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
					})
					.returning()
					.get();
			});
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

		eligibleUsers({ budgetId }: { budgetId: string }) {
			return database
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
		},

		getById({ budgetId }: { budgetId: string }) {
			return database
				.select()
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
		},

		getInvitations() {
			const inviterAlias = alias(tables.usersToBudgets, 'inviter_utb');
			const inviterUserAlias = alias(tables.users, 'inviter_user');

			return database
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
				.leftJoin(tables.budgets, eq(tables.budgets.id, tables.usersToBudgets.budgetId))
				.where(
					and(eq(tables.usersToBudgets.userId, user.id), eq(tables.usersToBudgets.role, 'INVITEE'))
				)
				.all();
		},

		/**
		 * Retrieves the total amount of money that has not been assigned to any category for a given budget.
		 */
		getUnassigned({ budgetId }: { budgetId: string }) {
			return database
				.select({
					sum: sql<number>`
					${queries.budget.totalSumOfIncome({
						budgetId: tables.budgets.id,
						database
					})}
					-
					${queries.budget.totalSumOfAssingments({
						budgetId: tables.budgets.id,
						database
					})}
				`
				})
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
		},

		getUsers({ budgetId }: { budgetId: string }) {
			return database
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
						userHasPermission({
							budgetIdCol: tables.usersToBudgets.budgetId,
							database,
							userId: user.id
						})
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
		},

		inviteUser({ budgetId, userId }: { budgetId: string; userId: string }) {
			const currentUser = database
				.select({ role: tables.usersToBudgets.role })
				.from(tables.usersToBudgets)
				.where(
					and(
						eq(tables.usersToBudgets.budgetId, budgetId),
						eq(tables.usersToBudgets.userId, user.id)
					)
				)
				.get();

			if (currentUser?.role !== 'OWNER') {
				throw new Error('Forbidden');
			}

			return database
				.insert(tables.usersToBudgets)
				.values({
					budgetId,
					role: 'INVITEE',
					userId
				})
				.returning()
				.get();
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

		removeUser({ budgetId, removeUserId }: { budgetId: string; removeUserId: string }) {
			const budgetUsers = database
				.select({ id: tables.usersToBudgets.userId, role: tables.usersToBudgets.role })
				.from(tables.usersToBudgets)
				.where(eq(tables.usersToBudgets.budgetId, budgetId))
				.all();

			const currentUser = budgetUsers.find(({ id }) => id === user.id);
			const isOwner = currentUser?.role === 'OWNER';
			const isDenyingOwnInvite = currentUser?.role === 'INVITEE' && removeUserId === user.id;

			if (!isOwner && !isDenyingOwnInvite) {
				throw new Error('Forbidden');
			}

			return database
				.delete(tables.usersToBudgets)
				.where(
					and(
						eq(tables.usersToBudgets.budgetId, budgetId),
						eq(tables.usersToBudgets.userId, removeUserId)
					)
				)
				.run();
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
