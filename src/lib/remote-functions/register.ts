import { getAccount, getAccountBalances } from './account.remote';
import { getCheckpointSummary, listTransactions } from './register.remote';

/**
 * The queries a change to an account's register makes stale: its rows, the
 * balance figures (`getAccount.balance` for the total, `getAccountBalances`
 * for the validated/pending split) and whether a Checkpoint is suggested.
 * Servers refresh them with `refreshRegisters()`; clients that refresh by
 * query function declare them with `.updates(...registerQueries)`.
 */
export const registerQueries = [
	listTransactions,
	getAccount,
	getAccountBalances,
	getCheckpointSummary
] as const;
