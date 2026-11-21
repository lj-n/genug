import { requested } from '$app/server';

import { getAccount, getAccountBalances } from './account.remote';
import { getCheckpointSummary, listTransactions } from './register.remote';
import { REFRESH_LIMIT } from './remote.utils';

/**
 * Refreshes every `registerQueries` instance the client declared (spelled
 * out: `requested` cannot take the mixed list). Every mutation of
 * transactions or Checkpoints calls it; the client's `.updates(...)` declares
 * which instances each surface holds (see docs/dev/remote-functions.md).
 */
export function refreshRegisters() {
	return Promise.all([
		requested(listTransactions, REFRESH_LIMIT).refreshAll(),
		requested(getAccount, REFRESH_LIMIT).refreshAll(),
		requested(getAccountBalances, REFRESH_LIMIT).refreshAll(),
		requested(getCheckpointSummary, REFRESH_LIMIT).refreshAll()
	]);
}
