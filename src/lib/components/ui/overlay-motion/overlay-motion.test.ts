import { afterEach, describe, expect, it, vi } from 'vitest';

import { rowSlide } from './overlay-motion';

function preferReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query === '(prefers-reduced-motion: reduce)'
	}));
}

afterEach(() => vi.unstubAllGlobals());

describe('rowSlide (#430)', () => {
	it('slides an inline row in over 150ms', () => {
		preferReducedMotion(false);
		expect(rowSlide(document.createElement('div')).duration).toBe(150);
	});

	it('does not animate when the user prefers reduced motion', () => {
		preferReducedMotion(true);
		expect(rowSlide(document.createElement('div')).duration).toBe(0);
	});
});
