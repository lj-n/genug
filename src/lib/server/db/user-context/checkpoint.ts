import type { Money } from '$lib/utils/money';

import { database, type Database, tables } from '$db';
import { DAY_IN_MS } from '$db/auth/utils';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { hasAccess } from './access';

/**
 * Checkpoint suggested (GLOSSARY.md) for the viewing user: something validated
 * is uncovered, and either the account never had a Checkpoint or one of the
 * user's reminder thresholds is reached. With both thresholds off, never.
 */
function isSuggested(
	userId: string,
	db: Database,
	accountId: string,
	lastCheckpointAt: Date | null
) {
	const thresholds = db
		.select({
			count: tables.users.checkpointCountThreshold,
			days: tables.users.checkpointDaysThreshold
		})
		.from(tables.users)
		.where(eq(tables.users.id, userId))
		.get()!;
	if (thresholds.count === null && thresholds.days === null) return false;

	const uncoveredCount = db
		.select({ count: sql<number>`count(*)` })
		.from(tables.transactions)
		.where(uncovered(accountId))
		.get()!.count;
	if (uncoveredCount === 0) return false;
	if (!lastCheckpointAt) return true;

	const daysReached =
		thresholds.days !== null &&
		Date.now() - lastCheckpointAt.getTime() >= thresholds.days * DAY_IN_MS;
	const countReached = thresholds.count !== null && uncoveredCount >= thresholds.count;
	return daysReached || countReached;
}

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

/**
 * Newest first. Setting two Checkpoints within the same millisecond is
 * possible, so insertion order breaks the tie.
 */
const newestFirst = [desc(tables.checkpoints.createdAt), desc(sql`${tables.checkpoints}.rowid`)];

export const queries = (userId: string, db: Database = database) => ({
	/** The account's Checkpoints, newest first, with how many transactions each seals. */
	history: (accountId: string) => {
		readAccount(userId, db, accountId);

		return db
			.select({
				adjustment: tables.checkpoints.adjustment,
				bankBalance: tables.checkpoints.bankBalance,
				createdAt: tables.checkpoints.createdAt,
				id: tables.checkpoints.id,
				sealedCount: db.$count(
					tables.transactions,
					eq(tables.transactions.checkpointId, tables.checkpoints.id)
				)
			})
			.from(tables.checkpoints)
			.where(eq(tables.checkpoints.accountId, accountId))
			.orderBy(...newestFirst)
			.all();
	},

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
	},

	/**
	 * What the account page shows of Checkpoints: when the latest was set, and
	 * whether a new one is suggested to the viewing user. Never suggested on an
	 * archived account.
	 */
	summary: (accountId: string) => {
		const account = readAccount(userId, db, accountId);

		const lastCheckpointAt =
			db
				.select({ createdAt: tables.checkpoints.createdAt })
				.from(tables.checkpoints)
				.where(eq(tables.checkpoints.accountId, accountId))
				.orderBy(desc(tables.checkpoints.createdAt))
				.limit(1)
				.get()?.createdAt ?? null;

		return {
			lastCheckpointAt,
			suggested: !account.archivedAt && isSuggested(userId, db, accountId, lastCheckpointAt)
		};
	}
});

export const commands = (userId: string, db: Database = database) => ({
	/**
	 * Deletes the account's latest Checkpoint (ADR-0017): unseals exactly its
	 * transactions and removes the record. No transaction is rewritten or
	 * deleted, so its Adjustment stays as an ordinary transaction.
	 */
	delete: (checkpointId: string) =>
		db.transaction((tx) => {
			const checkpoint = db
				.select({ accountId: tables.checkpoints.accountId })
				.from(tables.checkpoints)
				.where(eq(tables.checkpoints.id, checkpointId))
				.get();
			if (!checkpoint) error(404, m.error_checkpoint_not_found());

			const account = readAccount(userId, db, checkpoint.accountId);
			if (account.archivedAt)
				error(400, {
					code: 'account_archived',
					message: m.checkpoint_error_account_archived_delete()
				});

			const latest = db
				.select({ id: tables.checkpoints.id })
				.from(tables.checkpoints)
				.where(eq(tables.checkpoints.accountId, account.id))
				.orderBy(...newestFirst)
				.get()!;
			if (latest.id !== checkpointId)
				error(400, {
					code: 'checkpoint_not_latest',
					message: m.checkpoint_error_not_latest()
				});

			tx.update(tables.transactions)
				.set({ checkpointId: null })
				.where(eq(tables.transactions.checkpointId, checkpointId))
				.run();
			tx.delete(tables.checkpoints).where(eq(tables.checkpoints.id, checkpointId)).run();
		}),

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
