import { database, type Database, tables } from '$db';
import { getLocalTimeZone, today } from '@internationalized/date';
import { and, asc, eq, sql } from 'drizzle-orm';

import { userHasRole } from './budget.utils';

export function createAccount({
	data,
	db = database,
	startingBalance = 0,
	userId
}: {
	data: Pick<typeof tables.accounts.$inferInsert, 'budgetId' | 'name' | 'notes'>;
	db?: Database;
	startingBalance?: number;
	userId: string;
}) {
	const currentDate = today(getLocalTimeZone()).toString();

	return db.transaction((tx) => {
		const budget = tx
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(
				and(
					eq(tables.budgets.id, data.budgetId),
					userHasRole('MEMBER', tables.budgets.id, userId, db)
				)
			)
			.get();

		if (!budget) throw new Error();

		const account = tx.insert(tables.accounts).values(data).returning().get();

		tx.insert(tables.userEntityOrder)
			.values({ entityId: account.id, entityType: 'account', position: 0, userId })
			.run();

		if (startingBalance !== 0) {
			tx.insert(tables.transactions)
				.values({
					accountId: account.id,
					amount: startingBalance,
					budgetId: data.budgetId,
					date: currentDate,
					validated: true
				})
				.run();
		}

		return account;
	});
}

export function getAllAccounts({
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
			balance: sql<number>`COALESCE(SUM(${tables.transactions.amount}), 0)`,
			budgetId: tables.accounts.budgetId,
			id: tables.accounts.id,
			name: tables.accounts.name
		})
		.from(tables.accounts)
		.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
		.leftJoin(
			tables.userEntityOrder,
			and(
				eq(tables.userEntityOrder.entityType, 'account'),
				eq(tables.userEntityOrder.userId, userId),
				eq(tables.userEntityOrder.entityId, tables.accounts.id)
			)
		)
		.orderBy(
			sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
			asc(tables.userEntityOrder.position),
			asc(tables.accounts.createdAt),
			asc(tables.accounts.id)
		)
		.where(
			and(
				eq(tables.accounts.budgetId, budgetId),
				userHasRole('MEMBER', tables.accounts.budgetId, userId, db)
			)
		)
		.groupBy(tables.accounts.id)
		.all();
}
