import { describe, expect, it } from 'vitest';

import { stickyParam } from './sticky-param';

describe('stickyParam', () => {
	it('returns the source value while it is defined', () => {
		let source: string | undefined = 'a';
		const sticky = stickyParam(() => source);
		expect(sticky()).toBe('a');
		source = 'b';
		expect(sticky()).toBe('b');
	});

	it('returns the last defined value once the source becomes undefined', () => {
		let source: string | undefined = 'a';
		const sticky = stickyParam(() => source);
		expect(sticky()).toBe('a');
		source = undefined;
		expect(sticky()).toBe('a');
	});

	it('returns undefined before any defined value', () => {
		const sticky = stickyParam<string>(() => undefined);
		expect(sticky()).toBeUndefined();
	});

	it('latches the newest defined value across a transient gap', () => {
		let source: string | undefined = 'a';
		const sticky = stickyParam(() => source);
		expect(sticky()).toBe('a');
		source = 'b';
		expect(sticky()).toBe('b');
		source = undefined;
		expect(sticky()).toBe('b');
	});
});
