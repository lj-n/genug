import { requested } from '$app/server';
import { CheckpointSetSchema } from '$lib/schemas/checkpoint';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';
import * as v from 'valibot';

import { getAccount, getAccountBalances, getAccounts } from './account.remote';
import { REFRESH_LIMIT } from './remote.utils';
import { listTransactions } from './transaction.remote';

export const getCheckpointOverview = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.checkpoint.overview(accountId)
);

/** The account page's view of Checkpoints for the viewing user. */
export const getCheckpointSummary = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.checkpoint.summary(accountId)
);

export const setCheckpoint = guardedForm(
	CheckpointSetSchema,
	async ({ accountId, bankBalance }, { ctx }) => {
		ctx.checkpoint.set(accountId, bankBalance);
		// An Adjustment moves the account's Balance, and sealing changes the register.
		await Promise.all([
			requested(getCheckpointOverview, REFRESH_LIMIT).refreshAll(),
			requested(getCheckpointSummary, REFRESH_LIMIT).refreshAll(),
			requested(getAccount, REFRESH_LIMIT).refreshAll(),
			requested(getAccountBalances, REFRESH_LIMIT).refreshAll(),
			requested(getAccounts, REFRESH_LIMIT).refreshAll(),
			requested(listTransactions, REFRESH_LIMIT).refreshAll()
		]);
	}
);
