import * as v from 'valibot';

import { formatDate } from './format-date';

declare const MonthBrand: unique symbol;

/**
 * A calendar month encoded as a YYYYMM integer (e.g. 202501) — the encoding
 * used by the `[month=month]` URL param and the `budget_assignments.month`
 * column. Obtain values via `parseMonth`, `currentMonth`, or `MonthSchema`;
 * never by casting.
 */
export type Month = number & { readonly [MonthBrand]: true };

// Mirrors the check constraint on budget_assignments (`src/lib/server/db/tables/budgets.ts`).
const MIN_MONTH = 190001;
const MAX_MONTH = 210012;

export function addMonths(month: Month, delta: number): Month {
	const zeroBased = Math.floor(month / 100) * 12 + (month % 100) - 1 + delta;
	return (Math.floor(zeroBased / 12) * 100 + (zeroBased % 12) + 1) as Month;
}

export function addYears(month: Month, delta: number): Month {
	return (month + delta * 100) as Month;
}

export function currentMonth(date = new Date()): Month {
	return (date.getFullYear() * 100 + date.getMonth() + 1) as Month;
}

export function formatMonth({
	locale,
	month,
	options
}: {
	locale?: Parameters<typeof formatDate>[0]['locale'];
	month: Month;
	options?: Intl.DateTimeFormatOptions;
}): string {
	return formatDate({
		date: new Date(Math.floor(month / 100), (month % 100) - 1, 1),
		locale,
		options
	});
}

export function monthsOfYear(month: Month): Month[] {
	const year = Math.floor(month / 100) * 100;
	return Array.from({ length: 12 }, (_, i) => (year + i + 1) as Month);
}

export function parseMonth(value: number | string): Month | null {
	const num = typeof value === 'string' ? parseInt(value) : value;
	return isValidMonth(num) ? (num as Month) : null;
}

export function toParam(month: Month): string {
	return String(month);
}

function isValidMonth(value: number): boolean {
	return (
		Number.isInteger(value) &&
		value >= MIN_MONTH &&
		value <= MAX_MONTH &&
		value % 100 >= 1 &&
		value % 100 <= 12
	);
}

export const MonthSchema = v.pipe(
	v.number(),
	v.integer(),
	v.check((value) => parseMonth(value) !== null),
	v.transform((value) => value as Month)
);
