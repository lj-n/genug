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

/**
 * Get a list of the last `n` months.
 */
export function getLastMonthsNames(n = 12): { name: string; date: string }[] {
	const currentDate = new Date();
	const months: { name: string; date: string }[] = [];

	for (let i = 0; i < n; i++) {
		months.push({
			name: currentDate.toLocaleString('default', { month: 'long' }),
			date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
				.toString()
				.padStart(2, '0')}`
		});
		currentDate.setMonth(currentDate.getMonth() - 1);
	}

	return months;
}

/**
 * Props for a text input to only allow digits.
 */
export const currencyInputProps = {
	pattern: '^\\d+$',
	title: 'Please enter only digits (fractional monetary units)'
};

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
