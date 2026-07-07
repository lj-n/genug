import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

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
				pending: sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = false THEN ${tables.transactions.amount} ELSE 0 END), 0)`,
				validated: sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = true THEN ${tables.transactions.amount} ELSE 0 END), 0)`
			})
			.from(tables.accounts)
			.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
			.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
			.groupBy(tables.accounts.id)
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

		const duplicate = db
			.select({ id: tables.accounts.id })
			.from(tables.accounts)
			.where(and(eq(tables.accounts.name, data.name), eq(tables.accounts.budgetId, data.budgetId)))
			.get();
		if (duplicate) error(400, m.account_error_duplicate_name({ value: data.name }));

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
		const self = alias(tables.accounts, 'self');
		const duplicate = db
			.select({ id: tables.accounts.id })
			.from(tables.accounts)
			.innerJoin(self, eq(self.budgetId, tables.accounts.budgetId))
			.where(
				and(
					hasAccess(tables.accounts, userId, db),
					eq(self.id, accountId),
					eq(tables.accounts.name, name),
					ne(tables.accounts.id, accountId)
				)
			)
			.get();
		if (duplicate) error(400, m.account_error_duplicate_name({ value: name }));

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
