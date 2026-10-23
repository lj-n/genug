import { foreignKey, index, sqliteTable } from 'drizzle-orm/sqlite-core';

import { createId } from '../../utils/create-id';
import { accounts } from './accounts';
import { budgets } from './budgets';
import { users } from './users';

/**
 * A Checkpoint records that an account's validated Balance matched the bank
 * on setting it (ADR-0017). Transactions it seals point at it through
 * `transactions.checkpoint_id`.
 */
export const checkpoints = sqliteTable(
	'checkpoints',
	(t) => ({
		accountId: t
			.text('account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),
		/** The Adjustment booked when setting it, or null when both sides matched. */
		adjustment: t.integer('adjustment', { mode: 'number' }),
		/** The bank balance the user entered (Money, integer cents). */
		bankBalance: t.integer('bank_balance', { mode: 'number' }).notNull(),
		budgetId: t
			.text('budget_id')
			.references(() => budgets.id, { onDelete: 'cascade' })
			.notNull(),
		// Millisecond precision: an account's latest Checkpoint is decided by it.
		createdAt: t
			.integer('created_at', { mode: 'timestamp_ms' })
			.$defaultFn(() => new Date())
			.notNull(),
		createdBy: t.text('created_by').references(() => users.id, {
			onDelete: 'set null'
		}),
		id: t
			.text('id')
			.primaryKey()
			.$defaultFn(() => createId())
	}),
	(t) => [
		index('checkpoint_account_created').on(t.accountId, t.createdAt),
		foreignKey({
			columns: [t.accountId, t.budgetId],
			foreignColumns: [accounts.id, accounts.budgetId]
		})
	]
);
