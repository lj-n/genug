import { getLocale, type Locale } from '$lib/paraglide/runtime';
import { NumberFormatter } from '@internationalized/number';

import type { CURRENCIES } from './currencies';

export function formatCurrency({
	centValue,
	currency,
	locale = getLocale(),
	options
}: {
	centValue: number;
	currency: (typeof CURRENCIES)[number];
	locale?: Locale;
	options?: Intl.NumberFormatOptions;
}): string {
	const float = centValue / 100;
	return new NumberFormatter(locale, {
		currency,
		style: 'currency',
		...options
	}).format(float);
}
