import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { TransactionsURLParamsSchema } from './transaction';

describe('TransactionsURLParamsSchema showSealed', () => {
	const parse = (showSealed: unknown) =>
		v.parse(TransactionsURLParamsSchema, { showSealed }).showSealed;

	it('reads the URL value, not its presence', () => {
		expect(parse('true')).toBe(true);
		expect(parse('false')).toBe(false);
	});

	it('hides sealed rows when the param is absent', () => {
		expect(parse(null)).toBe(false);
		expect(parse(undefined)).toBe(false);
	});

	it('passes a boolean through, as the register query receives it', () => {
		expect(parse(true)).toBe(true);
		expect(parse(false)).toBe(false);
	});

	it('rejects any other value, like the other URL params', () => {
		expect(() => parse('yes')).toThrow();
	});
});
