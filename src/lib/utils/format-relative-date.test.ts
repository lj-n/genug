import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

import { formatRelativeDate } from './format-relative-date';

const now = new Date(2026, 6, 18);

describe('formatRelativeDate', () => {
	it('uses day granularity near today', () => {
		expect(formatRelativeDate({ date: new Date(2026, 6, 18), locale: 'en', now })).toBe('today');
		expect(formatRelativeDate({ date: new Date(2026, 6, 17), locale: 'en', now })).toBe(
			'yesterday'
		);
		expect(formatRelativeDate({ date: new Date(2026, 6, 15), locale: 'en', now })).toBe(
			'3 days ago'
		);
	});

	it('coarsens to weeks, months, and years with distance', () => {
		expect(formatRelativeDate({ date: new Date(2026, 6, 8), locale: 'en', now })).toBe('last week');
		expect(formatRelativeDate({ date: new Date(2026, 3, 18), locale: 'en', now })).toBe(
			'3 months ago'
		);
		expect(formatRelativeDate({ date: new Date(2024, 5, 1), locale: 'en', now })).toBe(
			'2 years ago'
		);
	});

	it('accepts CalendarDate values', () => {
		expect(formatRelativeDate({ date: new CalendarDate(2026, 7, 17), locale: 'en', now })).toBe(
			'yesterday'
		);
	});
});
