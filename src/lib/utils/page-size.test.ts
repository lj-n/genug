import { describe, expect, it } from 'vitest';

import { PAGE_SIZE_COOKIE_NAME, PAGE_SIZES, resolvePageSize } from './page-size';

describe('resolvePageSize', () => {
	it('maps each allowed option to that page size', () => {
		expect(resolvePageSize('15')).toBe(15);
		expect(resolvePageSize('25')).toBe(25);
		expect(resolvePageSize('50')).toBe(50);
		expect(resolvePageSize('100')).toBe(100);
	});

	it('falls back to 15 when the cookie is absent', () => {
		expect(resolvePageSize(undefined)).toBe(15);
		expect(resolvePageSize(null)).toBe(15);
	});

	it('falls back to 15 for an invalid or out-of-range value rather than trusting it', () => {
		expect(resolvePageSize('')).toBe(15);
		expect(resolvePageSize('abc')).toBe(15);
		expect(resolvePageSize('30')).toBe(15);
		expect(resolvePageSize('25.0')).toBe(15);
		expect(resolvePageSize('-25')).toBe(15);
	});
});

describe('PAGE_SIZES', () => {
	it('lists the selectable per-page options in display order', () => {
		expect(PAGE_SIZES).toEqual(['15', '25', '50', '100']);
	});
});

describe('PAGE_SIZE_COOKIE_NAME', () => {
	it('is the page-size cookie key read by the server and written by the client', () => {
		expect(PAGE_SIZE_COOKIE_NAME).toBe('pageSize');
	});
});
