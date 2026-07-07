import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import {
	addMonths,
	addYears,
	currentMonth,
	formatMonth,
	MonthSchema,
	monthsOfYear,
	parseMonth,
	toParam
} from './month';

describe('parseMonth', () => {
	it('parses a valid YYYYMM string', () => {
		expect(parseMonth('202501')).toBe(202501);
	});

	it('parses a valid YYYYMM number', () => {
		expect(parseMonth(202512)).toBe(202512);
	});

	it('accepts the range bounds', () => {
		expect(parseMonth(190001)).toBe(190001);
		expect(parseMonth(210012)).toBe(210012);
	});

	it('rejects values outside the range', () => {
		expect(parseMonth(189912)).toBeNull();
		expect(parseMonth(210101)).toBeNull();
	});

	it('rejects invalid month parts', () => {
		expect(parseMonth(202500)).toBeNull();
		expect(parseMonth(202513)).toBeNull();
	});

	it('rejects non-numeric strings and non-integers', () => {
		expect(parseMonth('abc')).toBeNull();
		expect(parseMonth(202501.5)).toBeNull();
	});
});

describe('currentMonth', () => {
	it('encodes a date as YYYYMM', () => {
		expect(currentMonth(new Date(2025, 0, 15))).toBe(202501);
		expect(currentMonth(new Date(2025, 11, 31))).toBe(202512);
	});
});

describe('toParam', () => {
	it('renders the YYYYMM string used in URLs', () => {
		expect(toParam(parseMonth(202501)!)).toBe('202501');
	});
});

describe('addMonths', () => {
	it('steps within a year', () => {
		expect(addMonths(parseMonth(202505)!, 1)).toBe(202506);
		expect(addMonths(parseMonth(202505)!, -1)).toBe(202504);
	});

	it('rolls over year boundaries', () => {
		expect(addMonths(parseMonth(202512)!, 1)).toBe(202601);
		expect(addMonths(parseMonth(202501)!, -1)).toBe(202412);
	});

	it('handles multi-year deltas', () => {
		expect(addMonths(parseMonth(202506)!, 19)).toBe(202701);
		expect(addMonths(parseMonth(202506)!, -18)).toBe(202312);
	});
});

describe('addYears', () => {
	it('keeps the month part', () => {
		expect(addYears(parseMonth(202507)!, 1)).toBe(202607);
		expect(addYears(parseMonth(202507)!, -2)).toBe(202307);
	});
});

describe('monthsOfYear', () => {
	it('lists the 12 months of the value’s year', () => {
		const months = monthsOfYear(parseMonth(202507)!);
		expect(months).toHaveLength(12);
		expect(months[0]).toBe(202501);
		expect(months[11]).toBe(202512);
	});
});

describe('formatMonth', () => {
	it('formats for display', () => {
		const month = parseMonth(202501)!;
		expect(formatMonth({ locale: 'en', month, options: { month: 'short', year: '2-digit' } })).toBe(
			'Jan 25'
		);
		expect(formatMonth({ locale: 'en', month, options: { year: 'numeric' } })).toBe('2025');
	});
});

describe('MonthSchema', () => {
	it('accepts a valid month', () => {
		expect(v.parse(MonthSchema, 202501)).toBe(202501);
	});

	it('rejects invalid months', () => {
		expect(v.safeParse(MonthSchema, 42).success).toBe(false);
		expect(v.safeParse(MonthSchema, 202513).success).toBe(false);
		expect(v.safeParse(MonthSchema, 202501.5).success).toBe(false);
		expect(v.safeParse(MonthSchema, '202501').success).toBe(false);
	});
});
