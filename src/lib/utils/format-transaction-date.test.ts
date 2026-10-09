import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

import { formatTransactionDate } from './format-transaction-date';

describe('formatTransactionDate', () => {
	it('formats an instant as its local day, like the same calendar date', () => {
		expect(formatTransactionDate(new Date(2026, 6, 18, 23, 30))).toBe(
			formatTransactionDate(new CalendarDate(2026, 7, 18))
		);
	});
});
