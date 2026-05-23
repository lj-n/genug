import type { CalendarDate } from '@internationalized/date';

export function formatTransactionDate(
	intlContext: { formatDate: (date: CalendarDate, options: Intl.DateTimeFormatOptions) => string },
	date: CalendarDate
) {
	return intlContext.formatDate(date, {
		day: '2-digit',
		month: 'short',
		year: '2-digit'
	});
}
