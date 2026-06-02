import { getLocale, type Locale } from '$lib/paraglide/runtime';
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

export function formatDate({
	date,
	locale = getLocale(),
	options
}: {
	date: CalendarDate | Date;
	locale?: Locale;
	options?: Intl.DateTimeFormatOptions;
}): string {
	if (date instanceof CalendarDate) date = date.toDate(getLocalTimeZone());
	return new DateFormatter(locale, options).format(date);
}
