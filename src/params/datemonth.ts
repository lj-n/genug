import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return /^\d{4}-(0[1-9]|1[0-2])$/.test(param);
};
