import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is string => {
	// sql`${t.month} between 190001 and 210012 AND ${t.month} % 100 between 1 and 12`
	const month = parseInt(param);
	return (
		!isNaN(month) && month >= 190001 && month <= 210012 && month % 100 >= 1 && month % 100 <= 12
	);
}) satisfies ParamMatcher;
