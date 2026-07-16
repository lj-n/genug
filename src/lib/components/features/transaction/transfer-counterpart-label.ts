import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { m } from '$lib/paraglide/messages';

/**
 * Register-relative counterpart label for a transfer leg: "→ Savings" on the
 * outflow leg (money goes there), "← Checking" on the inflow leg (money came
 * from there).
 */
export function transferCounterpartLabel(transaction: ListTransaction) {
	const account = transaction.counterpartAccountName ?? '';
	return transaction.amount < 0
		? m.transfer_direction_to({ account })
		: m.transfer_direction_from({ account });
}
