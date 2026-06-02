import type { CalendarDate } from '@internationalized/date';

import { formatDate } from './format-date';

export function formatTransactionDate(date: CalendarDate) {
	return formatDate({
		date,
		options: {
			day: '2-digit',
			month: 'short',
			year: '2-digit'
		}
	});
}
