import type { SubmitFunction } from '@sveltejs/kit';
import type { Writable } from 'svelte/store';

type Locale = 'en-US' | 'de-DE';
type Currency = 'EUR' | 'USD';

export function formatFractionToLocaleCurrency(
	n: number,
	locales: Locale = 'de-DE',
	currency: Currency = 'EUR'
): string {
	return new Intl.NumberFormat(locales, { style: 'currency', currency }).format(
		n / 100
	);
}

export function getPercentage(value: number, total: number): number {
	return parseFloat(((value / total) * 100).toFixed(2));
}

/**
 * Props for a text input to only allow digits.
 */
export const currencyInputProps = {
	pattern: '^(-?\\d+|\\d+)$',
	title: 'Please enter only digits (fractional monetary units)'
} as const;

/**
 * Returns a SubmitFunction to be used with SvelteKit `enhance` action.
 * Sets the loading state after 300ms to prevent flickering on quick responses.
 * Sets an attribute `data-submitting` on the form element.
 */
export function withLoading(store: Writable<boolean>): SubmitFunction {
	return ({ cancel, formElement }) => {
		if (formElement.hasAttribute('data-submitting')) {
			cancel();
		}

		formElement.setAttribute('data-submitting', '');

		const timeout = setTimeout(() => {
			store.set(true);
		}, 300);

		return async ({ update }) => {
			clearTimeout(timeout);
			formElement.removeAttribute('data-submitting');
			store.set(false);
			update();
		};
	};
}
