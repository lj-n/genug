import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { and, eq, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess } from './access';
import { withOrder } from './utils';

/**
 * An account may be archived only when its Balance is zero and it has no
 * pending (unvalidated) transactions — the account-side (Balance) analog of
 * the category's envelope-side (Remaining) archivability rule.
 */
const readArchivability = (userId: string, db: Database, accountId: string) => {
	const found = db
		.select({
			balance: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`,
			pendingTransactionCount: sql<number>`coalesce(sum(CASE WHEN ${tables.transactions.validated} = false THEN 1 ELSE 0 END), 0)`
		})
		.from(tables.accounts)
		.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
		.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
		.groupBy(tables.accounts.id)
		.get();

	if (!found) error(404, m.error_account_not_found());
	return {
		archivable: found.balance === 0 && found.pendingTransactionCount === 0,
		...found
	};
};

/**
 * An account may be deleted only when no transaction of any kind — pending or
 * validated — references it. Because an account's Balance is nothing but the
 * sum of its transactions, "no transactions" subsumes "zero Balance". Strictly
 * stronger than archivability: Deletable ⟹ Archivable (see ADR-0011).
 */
const readDeletability = (userId: string, db: Database, accountId: string) => {
	const found = db
		.select({
			transactionCount: sql<number>`count(${tables.transactions.id})`
		})
		.from(tables.accounts)
		.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
		.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
		.groupBy(tables.accounts.id)
		.get();

	if (!found) error(404, m.error_account_not_found());
	return {
		deletable: found.transactionCount === 0,
		...found
	};
};

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
					isNull(tables.accounts.archivedAt),
					budgetId ? eq(tables.accounts.budgetId, budgetId) : undefined,
					hasAccess(tables.accounts, userId, db)
				)
			)
			.groupBy(tables.accounts.id)
			.$dynamic();

		return withOrder(qb, tables.accounts, 'account', userId).all();
	},

	archivability: (accountId: string) => readArchivability(userId, db, accountId),

	archived: (budgetId: string) => {
		return db
			.select({
				archivedAt: tables.accounts.archivedAt,
				balance: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`,
				budgetId: tables.accounts.budgetId,
				id: tables.accounts.id,
				name: tables.accounts.name
			})
			.from(tables.accounts)
			.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
			.where(
				and(
					isNotNull(tables.accounts.archivedAt),
					eq(tables.accounts.budgetId, budgetId),
					hasAccess(tables.accounts, userId, db)
				)
			)
			.groupBy(tables.accounts.id)
			.all();
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
				archivedAt: tables.accounts.archivedAt,
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
	},

	deletability: (accountId: string) => readDeletability(userId, db, accountId)
});

export const commands = (userId: string, db: Database = database) => ({
	archive: (id: string) =>
		db.transaction((tx) => {
			// better-sqlite3 serializes on a single connection, so reads
			// on `db` inside the transaction callback see the same
			// uncommitted state as `tx`.
			const state = readArchivability(userId, db, id);
			if (!state.archivable) error(400, m.error_account_not_archivable());

			const updated = tx
				.update(tables.accounts)
				.set({ archivedAt: new Date() })
				.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, id)))
				.returning()
				.get();

			if (!updated) error(404, m.error_account_not_found());
			return updated;
		}),

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

	delete: (id: string) =>
		db.transaction((tx) => {
			// better-sqlite3 serializes on a single connection, so reads
			// on `db` inside the transaction callback see the same
			// uncommitted state as `tx`.
			const state = readDeletability(userId, db, id);
			if (!state.deletable) error(400, m.error_account_not_deletable());

			const deleted = tx
				.delete(tables.accounts)
				.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, id)))
				.returning()
				.get();

			if (!deleted) error(404, m.error_account_not_found());

			// `transactions.account_id` cascades on delete, but the guard above
			// forbids any referencing transaction so that path is unreachable.
			// `user_entity_order` keys on the account id without a cascade —
			// remove every user's ordering entry for this account ourselves
			// (see ADR-0011).
			tx.delete(tables.userEntityOrder)
				.where(
					and(
						eq(tables.userEntityOrder.entityType, 'account'),
						eq(tables.userEntityOrder.entityId, id)
					)
				)
				.run();

			return deleted;
		}),

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
	},

	restore: (id: string) => {
		const updated = db
			.update(tables.accounts)
			.set({ archivedAt: null })
			.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, id)))
			.returning()
			.get();

		if (!updated) error(404, m.error_account_not_found());
		return updated;
	}
});
