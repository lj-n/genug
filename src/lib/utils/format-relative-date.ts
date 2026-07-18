import { getLocale, type Locale } from '$lib/paraglide/runtime';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';

const DAY_MS = 86_400_000;

/**
 * Formats a calendar date relative to today at day granularity or coarser —
 * "today", "3 days ago", "2 months ago". Week/month/year units are
 * day-count approximations (7/30/365), which is precise enough for display.
 */
export function formatRelativeDate({
	date,
	locale = getLocale(),
	now = new Date()
}: {
	date: CalendarDate | Date;
	locale?: Locale;
	now?: Date;
}): string {
	if (date instanceof CalendarDate) date = date.toDate(getLocalTimeZone());
	const days = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);

	const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
	const magnitude = Math.abs(days);
	if (magnitude < 7) return format.format(days, 'day');
	if (magnitude < 30) return format.format(Math.trunc(days / 7), 'week');
	if (magnitude < 365) return format.format(Math.trunc(days / 30), 'month');
	return format.format(Math.trunc(days / 365), 'year');
}

function startOfDay(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
