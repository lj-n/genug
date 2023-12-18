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
 * @returns Date in `YYYY-MM` format
 */
export function getMonthInFormat(date: Date): string {
	return `${date.getFullYear()}-${(date.getMonth() + 1)
		.toString()
		.padStart(2, '0')}`;
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
      date: getMonthInFormat(date)
    });
    date.setMonth(date.getMonth() - 1);
  }

  return months;
}