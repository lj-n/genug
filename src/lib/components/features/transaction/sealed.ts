import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { resolve } from '$app/paths';
import { formatTransactionDate } from '$lib/utils/format-transaction-date';
import { fromDate, getLocalTimeZone, toCalendarDate } from '@internationalized/date';

type SealedRow = Pick<
	ListTransaction,
	'accountId' | 'budgetId' | 'checkpointId' | 'counterpartAccountId' | 'sealedAt'
>;

/**
 * The history of the Checkpoint page that sealed the row. A transfer leg
 * sealed only through its partner points at the partner's account.
 */
export function checkpointHistoryHref(row: SealedRow) {
	const accountId = row.checkpointId ? row.accountId : (row.counterpartAccountId ?? row.accountId);
	return `${resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint', {
		accountId,
		budgetId: row.budgetId
	})}#history`;
}

/** The sealing Checkpoint's day, formatted like the register's dates. */
export function sealedDate({ sealedAt }: Pick<ListTransaction, 'sealedAt'>) {
	return sealedAt
		? formatTransactionDate(toCalendarDate(fromDate(sealedAt, getLocalTimeZone())))
		: '';
}
