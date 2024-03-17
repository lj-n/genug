export function getMonthName(date: Date, locale = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}

export function getMonthYear(date: Date, locale = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, {
		month: 'short',
		year: 'numeric'
	}).format(date);
}

/**
 * @returns string in `YYYY-MM` format
 */
export function formatDateToYearMonthString(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the previous and last month as formatted YYYY-MM strings.
 */
export function getPreviousAndLastMonth(date: Date): [string, string] {
	date.setMonth(date.getMonth() - 1);
	const previous = formatDateToYearMonthString(date);
	date.setMonth(date.getMonth() + 2);
	const last = formatDateToYearMonthString(date);
	return [previous, last];
}

/**
 * Returns an array of the previous months with their names and dates in the `YYYY-MM` format.
 * @param n The number of previous months to retrieve. Defaults to 12.
 * @returns An array of objects containing the name and date of each previous month.
 */
export function getPreviousMonthsWithNames(
	n = 12
): { name: string; date: string }[] {
	const date = new Date();
	const months: { name: string; date: string }[] = [];

	for (let i = 0; i < n; i++) {
		months.push({
			name: getMonthName(date),
			date: formatDateToYearMonthString(date)
		});
		date.setMonth(date.getMonth() - 1);
	}

	return months;
}
