import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';

import { normalizeFormError } from './form-error';

describe('normalizeFormError', () => {
	it('surfaces the body message of an HttpError as a known error', () => {
		let thrown: unknown;
		try {
			error(404, { message: 'Account not found.' });
		} catch (e) {
			thrown = e;
		}

		const normalized = normalizeFormError(thrown);

		expect(normalized.kind).toBe('known');
		expect(normalized.message).toBe('Account not found.');
		expect(normalized.raw).toBe(thrown);
	});

	it('falls back to the generic message for a plain Error', () => {
		const raw = new Error('connection reset by peer');

		const normalized = normalizeFormError(raw);

		expect(normalized.kind).toBe('unexpected');
		expect(normalized.message).toBe(m.form_error_unexpected());
		expect(normalized.message).not.toContain('connection reset');
		expect(normalized.raw).toBe(raw);
	});

	it('falls back to the generic message for non-error values', () => {
		expect(normalizeFormError('boom').kind).toBe('unexpected');
		expect(normalizeFormError(undefined).message).toBe(m.form_error_unexpected());
		expect(normalizeFormError(null).kind).toBe('unexpected');
	});
});
