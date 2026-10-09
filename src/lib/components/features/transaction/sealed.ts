import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { resolve } from '$app/paths';
import { formatTransactionDate } from '$lib/utils/format-transaction-date';

type SealedRow = Pick<
	ListTransaction,
	'accountId' | 'budgetId' | 'checkpointId' | 'counterpartAccountId' | 'sealedAt'
>;

/** The history section of an account's Checkpoint page. */
export function checkpointHistoryHref({
	accountId,
	budgetId
}: Pick<ListTransaction, 'accountId' | 'budgetId'>) {
	return `${resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint', {
		accountId,
		budgetId
	})}#history`;
}

/** The sealing Checkpoint's day, formatted like the register's dates. */
export function sealedDate({ sealedAt }: Pick<ListTransaction, 'sealedAt'>) {
	return sealedAt ? formatTransactionDate(sealedAt) : '';
}

/**
 * The history of the Checkpoint page that sealed the row. A transfer leg
 * sealed only through its partner points at the partner's account.
 */
export function sealingCheckpointHistoryHref(row: SealedRow) {
	return checkpointHistoryHref({
		accountId: row.checkpointId ? row.accountId : (row.counterpartAccountId ?? row.accountId),
		budgetId: row.budgetId
	});
}
