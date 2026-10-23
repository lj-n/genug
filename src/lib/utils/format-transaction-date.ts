import type { CalendarDate } from '@internationalized/date';

import { formatDate } from './format-date';

/** Formats a calendar date, or an instant as its local day. */
export function formatTransactionDate(date: CalendarDate | Date) {
	return formatDate({
		date,
		options: {
			day: '2-digit',
			month: 'short',
			year: '2-digit'
		}
	});
}
