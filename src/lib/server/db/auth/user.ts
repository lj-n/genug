import { database, type Database, tables } from '$db';
import { and, desc, eq, getColumns, ne, notExists } from 'drizzle-orm';

import { hashPassword } from './index';

export function createUser({
	db = database,
	...userData
}: typeof tables.users.$inferInsert & {
	db?: Database;
}) {
	const { passwordHash: _, ...columns } = getColumns(tables.users);
	return db.insert(tables.users).values(userData).returning(columns).get();
}

export function deleteUser({ db = database, userId }: { db?: Database; userId: string }) {
	db.transaction((tx) => {
		const soloOwnerBudgets = tx
			.select({ budgetId: tables.usersToBudgets.budgetId })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					notExists(
						tx
							.select()
							.from(tables.usersToBudgets)
							.where(
								and(
									eq(tables.usersToBudgets.budgetId, tables.usersToBudgets.budgetId),
									ne(tables.usersToBudgets.userId, userId)
								)
							)
					)
				)
			)
			.all();

		for (const { budgetId } of soloOwnerBudgets) {
			tx.delete(tables.budgets).where(eq(tables.budgets.id, budgetId)).run();
		}

		const ownedBudgetsWithMembers = tx
			.select({ budgetId: tables.usersToBudgets.budgetId })
			.from(tables.usersToBudgets)
			.where(and(eq(tables.usersToBudgets.userId, userId), eq(tables.usersToBudgets.role, 'OWNER')))
			.all()
			.filter(({ budgetId }) => !soloOwnerBudgets.some((b) => b.budgetId === budgetId));

		for (const { budgetId } of ownedBudgetsWithMembers) {
			const nextMember = tx
				.select({ userId: tables.usersToBudgets.userId })
				.from(tables.usersToBudgets)
				.where(
					and(
						eq(tables.usersToBudgets.budgetId, budgetId),
						ne(tables.usersToBudgets.userId, userId)
					)
				)
				.limit(1)
				.get();

			if (nextMember) {
				tx.update(tables.usersToBudgets)
					.set({ role: 'OWNER' })
					.where(
						and(
							eq(tables.usersToBudgets.budgetId, budgetId),
							eq(tables.usersToBudgets.userId, nextMember.userId)
						)
					)
					.run();
			}
		}

		tx.delete(tables.users).where(eq(tables.users.id, userId)).run();
	});
}

export function getAllUsers({ db = database }: { db?: Database } = {}) {
	const { id, username } = getColumns(tables.users);
	return db.select({ id, username }).from(tables.users).orderBy(desc(tables.users.isAdmin)).all();
}

export async function isFirstUser({ db = database }: { db?: Database } = {}) {
	return (await db.$count(tables.users)) === 0;
}

export async function setPassword({
	db = database,
	password,
	userId
}: {
	db?: Database;
	password: string;
	userId: string;
}) {
	const passwordHashValue = await hashPassword({ password });
	db.update(tables.users)
		.set({ passwordHash: passwordHashValue })
		.where(eq(tables.users.id, userId))
		.run();
}

export function setUsername({
	db = database,
	userId,
	username
}: {
	db?: Database;
	userId: string;
	username: string;
}) {
	db.update(tables.users).set({ username }).where(eq(tables.users.id, userId)).run();
}
