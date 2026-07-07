import { describe, expect, it } from 'vitest';

import { focusRing, focusRingWithin } from '../focus-ring';
import { inputVariants } from './input-variants';

function classList(result: string): string[] {
	return result.split(/\s+/).filter(Boolean);
}

describe('inputVariants', () => {
	it('default variant renders the canonical chrome', () => {
		const result = classList(inputVariants());

		expect(result).toEqual(
			expect.arrayContaining(['rounded-lg', 'border', 'border-muted/30', 'bg-surface/70', 'h-9'])
		);
	});

	it('ghost variant yields no chrome — no border, background, ring, or radius classes', () => {
		const chrome = /^(border|bg-|ring|rounded)/;
		const result = classList(inputVariants({ variant: 'ghost' }));

		expect(result.filter((cls) => chrome.test(cls))).toEqual([]);
	});

	it('ghost variant keeps the shared sizing and padding', () => {
		const result = classList(inputVariants({ variant: 'ghost' }));

		expect(result).toEqual(expect.arrayContaining(['h-9', 'w-full', 'px-3', 'py-1']));
	});

	it.each(['default', 'ghost', 'container'] as const)(
		'base carries the error border for the %s variant',
		(variant) => {
			expect(classList(inputVariants({ variant }))).toContain('aria-invalid:border-error');
		}
	);

	it('base carries the muted placeholder', () => {
		expect(classList(inputVariants())).toContain('placeholder:text-muted');
	});

	it('default variant composes the focus-visible focus ring', () => {
		const result = classList(inputVariants());

		for (const cls of classList(focusRing)) {
			expect(result).toContain(cls);
		}
	});

	it('container variant composes the focus-within flavor instead of focus-visible', () => {
		const result = classList(inputVariants({ variant: 'container' }));

		for (const cls of classList(focusRingWithin)) {
			expect(result).toContain(cls);
		}
		expect(result.filter((cls) => cls.startsWith('focus-visible:'))).toEqual([]);
	});

	it('multiline drops the fixed height in favor of content-based sizing', () => {
		const result = classList(inputVariants({ multiline: true }));

		expect(result).toEqual(expect.arrayContaining(['field-sizing-content', 'min-h-16']));
		expect(result).not.toContain('h-9');
	});

	it('container variant carries the chrome but omits inner padding', () => {
		const result = classList(inputVariants({ variant: 'container' }));

		expect(result).toEqual(
			expect.arrayContaining(['rounded-lg', 'border', 'border-muted/30', 'bg-surface/70', 'h-9'])
		);
		expect(result.filter((cls) => /^p[xy]?-/.test(cls))).toEqual([]);
	});
});
