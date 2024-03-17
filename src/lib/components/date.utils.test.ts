import { describe, expect, test } from 'vitest';
import {
	formatDateToYearMonthString,
	getPreviousAndLastMonth
} from './date.utils';

describe('date utils', () => {
	test('get correct date in YYYY-MM format', () => {
		const date = new Date('2024-03-20');
		const formatted = formatDateToYearMonthString(date);
		expect(formatted).toBe('2024-03');

		const [previous, next] = getPreviousAndLastMonth(new Date('2024-03'));

		expect(previous).toBe('2024-02');
		expect(next).toBe('2024-04');
	});
});
