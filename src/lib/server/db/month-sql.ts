import { type Month, toParam } from '$lib/utils/month';
import { type AnyColumn, type SQL, sql } from 'drizzle-orm';

/**
 * SQL predicates comparing date columns (YYYY-MM-DD text) against a Month.
 * `strftime('%Y%m', …)` yields a string, so the month is bound as its YYYYMM
 * param string — this file is the only place that knows about this pairing.
 */

export function dateIsInMonth(dateColumn: AnyColumn, month: Month): SQL {
	return sql`strftime('%Y%m', ${dateColumn}) = ${toParam(month)}`;
}

export function dateIsOnOrBefore(dateColumn: AnyColumn, month: Month): SQL {
	return sql`strftime('%Y%m', ${dateColumn}) <= ${toParam(month)}`;
}
