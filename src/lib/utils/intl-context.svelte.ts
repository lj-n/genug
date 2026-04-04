import { getContext, setContext } from 'svelte';

type IntlContextConfig = {
	locale: string;
	numberFormatOptions: Intl.NumberFormatOptions;
};
class IntlContext {
	locale: string = $state('en');
	numberFormatOptions: Intl.NumberFormatOptions = $state({
		currency: 'EUR'
	});

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
