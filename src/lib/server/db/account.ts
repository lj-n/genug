import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

import * as accountQueries from './account.utils';
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
					notes: m.account_starting_balance_notes(),
					validated: true
				})
				.run();
		}

		return account;
	});
}

export function getAccountBalanceDetail({
	accountId,
	db = database
}: {
	accountId: string;
	db?: Database;
}) {
	const detail = db
		.select({
			pending: sql<number>`${accountQueries.pendingAccountBalance({ accountId: tables.accounts.id, database: db })}`,
			validated: sql<number>`${accountQueries.validatedAccountBalance({ accountId: tables.accounts.id, database: db })}`
		})
		.from(tables.accounts)
		.where(eq(tables.accounts.id, accountId))
		.get();

	if (!detail) throw new Error('Account not found');

	return detail;
}

export function getAccountById({
	db = database,
	id,
	userId
}: {
	db?: Database;
	id: string;
	userId: string;
}) {
	return db
		.select({
			balance: sql<number>`COALESCE(SUM(${tables.transactions.amount}), 0)`,
			budgetId: tables.accounts.budgetId,
			id: tables.accounts.id,
			name: tables.accounts.name,
			notes: tables.accounts.notes
		})
		.from(tables.accounts)
		.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
		.where(
			and(eq(tables.accounts.id, id), userHasRole('MEMBER', tables.accounts.budgetId, userId, db))
		)
		.groupBy(tables.accounts.id)
		.get();
}

export function getAllAccounts({
	budgetId,
	db = database,
	userId
}: {
	budgetId?: string;
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
				budgetId ? eq(tables.accounts.budgetId, budgetId) : undefined,
				userHasRole('MEMBER', tables.accounts.budgetId, userId, db)
			)
		)
		.groupBy(tables.accounts.id)
		.all();
}

export function reorderAccounts({
	db = database,
	orderedIds,
	userId
}: {
	db?: Database;
	orderedIds: string[];
	userId: string;
}) {
	const availableAccountIds = db
		.select({ id: tables.accounts.id })
		.from(tables.accounts)
		.where(
			and(
				inArray(tables.accounts.id, orderedIds),
				isNull(tables.accounts.archivedAt),
				userHasRole('MEMBER', tables.accounts.budgetId, userId, db)
			)
		)
		.all();

	if (availableAccountIds.length !== orderedIds.length) {
		throw new Error('Invalid account ids');
	}

	db.transaction((tx) => {
		for (const [position, accountId] of orderedIds.entries()) {
			tx.insert(tables.userEntityOrder)
				.values({ entityId: accountId, entityType: 'account', position, userId })
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

export function setAccountName({
	accountId,
	db = database,
	name
}: {
	accountId: string;
	db?: Database;
	name: string;
}) {
	return db
		.update(tables.accounts)
		.set({ name })
		.where(eq(tables.accounts.id, accountId))
		.returning()
		.get();
}
