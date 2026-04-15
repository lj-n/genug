import { CalendarDate } from '@internationalized/date';

/**
 * Takes the month param (e.g. "202401") and returns a CalendarDate object representing the first day of that month (e.g. { year: 2024, month: 1, day: 1 }).
 * Assumes that the input has already been validated by the `match` function in `src/params/month.ts`.
 */
export function createDateFromParams(param: string): CalendarDate {
	const year = parseInt(param.slice(0, 4));
	const month = parseInt(param.slice(4, 6));
	return new CalendarDate(year, month, 1);
}
