type Locale = 'en-US' | 'de-DE';
type Currency = 'EUR' | 'USD';

export function formatFractionToLocaleCurrency(
	n: number,
	locales: Locale = 'de-DE',
	currency: Currency = 'EUR'
): string {
	return new Intl.NumberFormat(locales, { style: 'currency', currency }).format(
		n
	);
}
