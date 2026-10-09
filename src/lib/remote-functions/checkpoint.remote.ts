import { requested } from '$app/server';
import { CheckpointIdSchema, CheckpointSetSchema } from '$lib/schemas/checkpoint';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';
import * as v from 'valibot';

import { getAccounts } from './account.remote';
import { refreshRegisters } from './register-refresh';
import { REFRESH_LIMIT } from './remote.utils';

export const getCheckpointOverview = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.checkpoint.overview(accountId)
);

export const getCheckpointHistory = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.checkpoint.history(accountId)
);

export const setCheckpoint = guardedForm(
	CheckpointSetSchema,
	async ({ accountId, bankBalance }, { ctx }) => {
		const checkpoint = ctx.checkpoint.set(accountId, bankBalance);
		// An Adjustment moves the account's Balance, and sealing changes the register.
		await Promise.all([
			refreshRegisters(),
			requested(getCheckpointOverview, REFRESH_LIMIT).refreshAll(),
			requested(getCheckpointHistory, REFRESH_LIMIT).refreshAll(),
			requested(getAccounts, REFRESH_LIMIT).refreshAll()
		]);
		return { checkpointId: checkpoint.id };
	}
);

export const deleteCheckpoint = guardedForm(
	CheckpointIdSchema,
	async ({ checkpointId }, { ctx }) => {
		ctx.checkpoint.delete(checkpointId);
		// Unsealing changes what the next Checkpoint seals, the register and the latest Checkpoint.
		await Promise.all([
			refreshRegisters(),
			requested(getCheckpointOverview, REFRESH_LIMIT).refreshAll(),
			requested(getCheckpointHistory, REFRESH_LIMIT).refreshAll()
		]);
	}
);
