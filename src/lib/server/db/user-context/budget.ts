import type { Month } from '$lib/utils/month';

import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, inArray, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess, ownerGuard } from './access';
import { categoryBalances, unassigned as unassignedForBudget } from './envelope';
import { withOrder } from './utils';

const findEligibleUser = (
	userId: string,
	db: Database,
	budgetId: string,
	inviteeName: string
): { userId: string } => {
	const currentUser = db
		.select({ username: tables.users.username })
		.from(tables.users)
		.where(eq(tables.users.id, userId))
		.get();

	if (currentUser?.username === inviteeName) {
		error(400, m.budget_users_error_its_you());
	}

	const existing = db
		.select({ role: tables.usersToBudgets.role })
		.from(tables.usersToBudgets)
		.innerJoin(tables.users, eq(tables.users.id, tables.usersToBudgets.userId))
		.where(
			and(eq(tables.usersToBudgets.budgetId, budgetId), eq(tables.users.username, inviteeName))
		)
		.get();

	if (existing) {
		error(
			400,
			existing.role === 'INVITEE'
				? m.budget_users_error_already_invited({ value: inviteeName })
				: m.budget_users_error_already_access({ value: inviteeName })
		);
	}

	const eligible = db
		.select({ id: tables.users.id })
		.from(tables.users)
		.leftJoin(
			tables.usersToBudgets,
			and(
				eq(tables.usersToBudgets.userId, tables.users.id),
				eq(tables.usersToBudgets.budgetId, budgetId)
			)
		)
		.where(and(eq(tables.users.username, inviteeName), isNull(tables.usersToBudgets.userId)))
		.get();

	if (!eligible) {
		error(400, m.budget_users_error_not_found({ value: inviteeName }));
	}

	return { userId: eligible.id };
};

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

	findEligibleUser: (budgetId: string, inviteeName: string) =>
		findEligibleUser(userId, db, budgetId, inviteeName),

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

	monthly: (budgetId: string, month: Month) => {
		const bal = categoryBalances(db, month);

		const qb = db
			.select({
				...getColumns(tables.categories),
				activity: sql<number>`coalesce(${bal.activity}, 0)`,
				assigned: sql<number>`coalesce(${bal.assigned}, 0)`,
				remaining: sql<number>`coalesce(${bal.remaining}, 0)`
			})
			.from(tables.categories)
			.leftJoin(bal, eq(bal.categoryId, tables.categories.id))
			.where(
				and(
					isNull(tables.categories.archivedAt),
					eq(tables.categories.budgetId, budgetId),
					hasAccess(tables.categories, userId, db)
				)
			)
			.$dynamic();

		return withOrder(qb, tables.categories, 'category', userId).all();
	},

	unassigned: (budgetId: string) => {
		const found = db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(and(eq(tables.budgets.id, budgetId), hasAccess(tables.budgets, userId, db)))
			.get();
		if (!found) return 0;
		return unassignedForBudget(db, budgetId);
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

	invite: (budgetId: string, inviteeName: string) => {
		ownerGuard(budgetId, userId, db);
		const { userId: inviteeId } = findEligibleUser(userId, db, budgetId, inviteeName);
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
		month: Month;
		sourceCategoryId: string;
		targetCategoryId: null | string;
	}) => {
		accessGuard(budgetId, userId, db);

		// Validate that both categories belong to this budget
		{
			const categoryIds = [sourceCategoryId];
			if (targetCategoryId !== null) categoryIds.push(targetCategoryId);
			const owned = db
				.select({ id: tables.categories.id })
				.from(tables.categories)
				.where(
					and(eq(tables.categories.budgetId, budgetId), inArray(tables.categories.id, categoryIds))
				)
				.all();
			if (owned.length !== categoryIds.length) error(400);
		}

		if (sourceCategoryId === targetCategoryId) error(400);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tx and db types don't share a useful supertype
		const deductSource = (exec: any) => {
			exec
				.insert(tables.budgetAssignments)
				.values({ amount: -amount, budgetId, categoryId: sourceCategoryId, month })
				.onConflictDoUpdate({
					set: { amount: sql`${tables.budgetAssignments.amount} - ${amount}` },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.run();
		};

		if (targetCategoryId === null) {
			deductSource(db);
			return;
		}

		db.transaction((tx) => {
			deductSource(tx);

			tx.insert(tables.budgetAssignments)
				.values({ amount, budgetId, categoryId: targetCategoryId, month })
				.onConflictDoUpdate({
					set: { amount: sql`${tables.budgetAssignments.amount} + ${amount}` },
					target: [tables.budgetAssignments.categoryId, tables.budgetAssignments.month]
				})
				.run();
		});
	}
});
