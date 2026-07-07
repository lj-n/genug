import type { ParamMatcher } from '@sveltejs/kit';

import { parseMonth } from '$lib/utils/month';

export const match = ((param: string): param is string =>
	parseMonth(param) !== null) satisfies ParamMatcher;
