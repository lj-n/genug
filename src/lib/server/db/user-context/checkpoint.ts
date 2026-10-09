import type { Money } from '$lib/utils/money';

import { database, type Database, tables } from '$db';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { hasAccess } from './access';

/** The account as a Checkpoint sees it; 404 when the user has no access to it. */
function readAccount(userId: string, db: Database, accountId: string) {
	const account = db
		.select({
			archivedAt: tables.accounts.archivedAt,
			budgetId: tables.accounts.budgetId,
			id: tables.accounts.id
		})
		.from(tables.accounts)
		.where(and(hasAccess(tables.accounts, userId, db), eq(tables.accounts.id, accountId)))
		.get();

	if (!account) error(404, m.error_account_not_found());
	return account;
}

function readValidatedBalance(db: Database, accountId: string) {
	return db
		.select({
			balance: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(
			and(eq(tables.transactions.accountId, accountId), eq(tables.transactions.validated, true))
		)
		.get()!.balance;
}

/** Validated, not yet sealed transactions of an account: what the next Checkpoint seals. */
function uncovered(accountId: string) {
	return and(
		eq(tables.transactions.accountId, accountId),
		eq(tables.transactions.validated, true),
		isNull(tables.transactions.checkpointId)
	);
}

export const queries = (userId: string, db: Database = database) => ({
	/**
	 * What the Checkpoint page shows before setting one: the validated Balance
	 * and the validated transactions the next Checkpoint would seal.
	 */
	overview: (accountId: string) => {
		readAccount(userId, db, accountId);

		const toSeal = db
			.select({
				count: sql<number>`count(*)`,
				firstDate: sql<null | string>`min(${tables.transactions.date})`,
				lastDate: sql<null | string>`max(${tables.transactions.date})`
			})
			.from(tables.transactions)
			.where(uncovered(accountId))
			.get()!;

		return { toSeal, validatedBalance: readValidatedBalance(db, accountId) };
	}
});

export const commands = (userId: string, db: Database = database) => ({
	/**
	 * Sets a Checkpoint at the entered bank balance (ADR-0017): books an
	 * Adjustment for any difference to the validated Balance, then seals every
	 * validated, not yet sealed transaction of the account, the Adjustment
	 * included. Both sides agree by construction, so it always succeeds on an
	 * active account.
	 */
	set: (accountId: string, bankBalance: Money) =>
		db.transaction((tx) => {
			// better-sqlite3 serializes on a single connection, so reads
			// on `db` inside the transaction callback see the same
			// uncommitted state as `tx`.
			const account = readAccount(userId, db, accountId);
			if (account.archivedAt)
				error(400, {
					code: 'account_archived',
					message: m.checkpoint_error_account_archived()
				});

			const adjustment = bankBalance - readValidatedBalance(db, accountId);

			if (adjustment !== 0) {
				tx.insert(tables.transactions)
					.values({
						accountId,
						amount: adjustment,
						budgetId: account.budgetId,
						createdBy: userId,
						date: today(getLocalTimeZone()).toString(),
						notes: m.checkpoint_adjustment_notes(),
						validated: true
					})
					.run();
			}

			const checkpoint = tx
				.insert(tables.checkpoints)
				.values({
					accountId,
					adjustment: adjustment === 0 ? null : adjustment,
					bankBalance,
					budgetId: account.budgetId,
					createdBy: userId
				})
				.returning()
				.get();

			tx.update(tables.transactions)
				.set({ checkpointId: checkpoint.id })
				.where(uncovered(accountId))
				.run();

			return checkpoint;
		})
});
