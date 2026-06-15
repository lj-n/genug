import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { accessGuard, hasAccess } from './access';
import { withOrder } from './utils';

export const queries = (userId: string, db: Database = database) => ({
	all: (budgetId?: string) => {
		const qb = db
			.select({
				balance: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`,
				budgetId: tables.accounts.budgetId,
				id: tables.accounts.id,
				name: tables.accounts.name
			})
			.from(tables.accounts)
			.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
			.where(
				and(
					budgetId ? eq(tables.accounts.budgetId, budgetId) : undefined,
					hasAccess(tables.accounts, userId, db)
				)
			)
			.groupBy(tables.accounts.id)
			.$dynamic();

		return withOrder(qb, tables.accounts, 'account', userId).all();
	},

	balances: (accountId: string) => {
		const detail = db
			.select({
				pending: sql<number>`(
					SELECT coalesce(sum(${tables.transactions.amount}), 0)
					FROM ${tables.transactions}
					WHERE ${tables.transactions.accountId} = ${tables.accounts.id}
					AND ${tables.transactions.validated} = false
				)`,
				validated: sql<number>`(
					SELECT coalesce(sum(${tables.transactions.amount}), 0)
					FROM ${tables.transactions}
					WHERE ${tables.transactions.accountId} = ${tables.accounts.id}
					AND ${tables.transactions.validated} = true
				)`
			})
			.from(tables.accounts)
			.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
			.get();

		if (!detail) error(404, { message: m.error_account_not_found() });
		return detail;
	},

	byId: (id: string) => {
		const found = db
			.select({
				balance: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`,
				budgetId: tables.accounts.budgetId,
				id: tables.accounts.id,
				name: tables.accounts.name,
				notes: tables.accounts.notes
			})
			.from(tables.accounts)
			.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
			.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, id)))
			.groupBy(tables.accounts.id)
			.get();

		if (!found) error(404, m.error_account_not_found());
		return found;
	}
});

export const commands = (userId: string, db: Database = database) => ({
	create: (
		data: Pick<typeof tables.accounts.$inferInsert, 'budgetId' | 'name' | 'notes'>,
		startingBalance: number = 0
	) => {
		const currentDate = today(getLocalTimeZone()).toString();
		accessGuard(data.budgetId, userId, db);

		return db.transaction((tx) => {
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
	},

	edit: (accountId: string, name: string) => {
		const updated = db
			.update(tables.accounts)
			.set({ name })
			.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
			.returning()
			.get();

		if (!updated) error(404);
		return updated;
	},

	reorder: (orderedIds: string[]) => {
		const availableIds = db
			.select({ id: tables.accounts.id })
			.from(tables.accounts)
			.where(
				and(
					inArray(tables.accounts.id, orderedIds),
					isNull(tables.accounts.archivedAt),
					hasAccess(tables.accounts, userId, db)
				)
			)
			.all();

		if (availableIds.length !== orderedIds.length) {
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
					.run();
			}
		});
	}
});
