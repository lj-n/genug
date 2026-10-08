// PROTOTYPE — throwaway (branch prototype/checkpoint-page, question 2).
// Fakes which register rows a Checkpoint has sealed and which variant renders
// them. Sealed = dated on/before the fake checkpoint and validated; a transfer
// counts as sealed regardless of this leg, standing in for "the other leg is"
// (ADR-0017: a transfer is fully sealed once either leg is). `?cp=none` seals
// nothing.

import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { resolve } from '$app/paths';
import { page } from '$app/state';
import { formatTransactionDate } from '$lib/utils/format-transaction-date';
import { parseDate } from '@internationalized/date';

const CHECKPOINT_DATE = '2026-10-06';

export function checkpointHref(accountId: string) {
	return `${resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint-prototype', {
		accountId,
		budgetId: page.params.budgetId ?? ''
	})}#history`;
}

export function isSealed(transaction: Pick<ListTransaction, 'date' | 'transferId' | 'validated'>) {
	if (page.url.searchParams.get('cp') === 'none') return false;
	if (transaction.date > CHECKPOINT_DATE) return false;
	return transaction.validated || transaction.transferId !== null;
}

export function sealedCheckpointLabel() {
	return formatTransactionDate(parseDate(CHECKPOINT_DATE));
}
