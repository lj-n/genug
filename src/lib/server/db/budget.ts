import { database, type Database, tables } from '$db';
import { and, asc, eq, getColumns, notExists, sql } from 'drizzle-orm';

import { orderByRole, userHasRole } from './budget.utils';

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
