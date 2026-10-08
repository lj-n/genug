import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE, resolvePageSize } from './page-size';

describe('resolvePageSize', () => {
	it.each([
		['15', 15],
		['25', 25],
		['50', 50],
		['100', 100]
	])('maps the allowed option %j to page size %i', (cookieValue, expected) => {
		expect(resolvePageSize(cookieValue)).toBe(expected);
	});

	it('falls back to the default page size when the cookie is absent', () => {
		expect(resolvePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
		expect(resolvePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
	});

	it('falls back to the default page size for an invalid or out-of-range value rather than trusting it', () => {
		for (const cookieValue of ['', 'abc', '30', '25.0', '-25']) {
			expect(resolvePageSize(cookieValue)).toBe(DEFAULT_PAGE_SIZE);
		}
	});
});
