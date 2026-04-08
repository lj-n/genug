import { formatValue } from '@canutin/svelte-currency-input';
import { DateFormatter } from '@internationalized/date';
import { getContext, setContext } from 'svelte';

import { formatCentToFloatString } from './formatCentToFloatString';

type IntlContextConfig = {
	locale: string;
	numberFormatOptions: Intl.NumberFormatOptions;
};
class IntlContext {
	locale: string = $state('de');
	numberFormatOptions: Intl.NumberFormatOptions = $state({
		currency: 'EUR'
	});
	formatCurrency = $derived((cents: number) =>
		formatValue({
			intlConfig: {
				locale: this.locale,
				...this.numberFormatOptions
			},
			value: formatCentToFloatString(cents)
		})
	);
	formatDate = $derived((date: Date, options: Intl.DateTimeFormatOptions = {}) =>
		new DateFormatter(this.locale, options).format(date)
	);

	constructor(config: IntlContextConfig) {
		this.numberFormatOptions = config.numberFormatOptions;
		this.locale = config.locale;
	}
}

const INTL_CONTEXT_KEY = Symbol('IntlContext');

export function getIntlContext() {
	return getContext<ReturnType<typeof setIntlContext>>(INTL_CONTEXT_KEY);
}

export function setIntlContext(config: IntlContextConfig) {
	return setContext(INTL_CONTEXT_KEY, new IntlContext(config));
}
