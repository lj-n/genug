import type { CURRENCIES } from '$lib/utils/currencies';

import { asMoney, formatMoney } from '$lib/utils/money';

/** A Checkpoint amount; `signed` shows the sign of an Adjustment, zero excepted. */
export function formatAmount(currency: (typeof CURRENCIES)[number], cents: number, signed = false) {
	return formatMoney({
		currency,
		money: asMoney(cents),
		options: signed ? { signDisplay: 'exceptZero' } : undefined
	});
}
