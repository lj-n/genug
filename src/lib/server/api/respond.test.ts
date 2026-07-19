import { m } from '$lib/paraglide/messages';
import { error, isHttpError } from '@sveltejs/kit';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { clientVersionIssue, parseMonthOrThrow, toErrorResponse } from './respond';

describe('clientVersionIssue', () => {
	it('allows a missing header (the gate is optional)', () => {
		expect(clientVersionIssue(null)).toBeNull();
		expect(clientVersionIssue('')).toBeNull();
	});

	it('allows any well-formed version when no minimum is configured', () => {
		expect(clientVersionIssue('ios/2026.7.0', {})).toBeNull();
	});

	it('rejects a version below its platform minimum', () => {
		expect(clientVersionIssue('ios/1.0.0', { ios: '2.0.0' })).toContain('below');
	});

	it('allows a version at or above the minimum', () => {
		expect(clientVersionIssue('ios/2.0.0', { ios: '2.0.0' })).toBeNull();
		expect(clientVersionIssue('ios/2.1', { ios: '2.0.0' })).toBeNull();
	});

	it('ignores an unknown platform and a malformed header', () => {
		expect(clientVersionIssue('android/1.0.0', { ios: '2.0.0' })).toBeNull();
		expect(clientVersionIssue('garbage', { ios: '2.0.0' })).toBeNull();
	});
});

describe('toErrorResponse', () => {
	async function bodyOf(err: unknown) {
		const response = toErrorResponse(err);
		return { body: (await response.json()) as { code: string; message: string }, response };
	}

	it('maps a valibot failure to a 400 validation_error', async () => {
		let err: unknown;
		try {
			v.parse(v.string(), 123);
		} catch (thrown) {
			err = thrown;
		}
		expect(v.isValiError(err)).toBe(true);
		const { body, response } = await bodyOf(err);
		expect(response.status).toBe(400);
		expect(body.code).toBe('validation_error');
	});

	it('keeps an HttpError status and derives a status-based code', async () => {
		let thrown: unknown;
		try {
			error(404);
		} catch (err) {
			thrown = err;
		}
		expect(isHttpError(thrown)).toBe(true);
		const { body, response } = await bodyOf(thrown);
		expect(response.status).toBe(404);
		expect(body.code).toBe('not_found');
	});

	it('carries a stable code set on the error body through the envelope', async () => {
		let archived: unknown;
		try {
			error(400, { code: 'account_archived', message: m.error_account_archived() });
		} catch (err) {
			archived = err;
		}
		const { body } = await bodyOf(archived);
		expect(body.code).toBe('account_archived');
		expect(body.message).toBe(m.error_account_archived());
	});

	it('wraps an unexpected error as a 500 internal_error', async () => {
		const { body, response } = await bodyOf(new Error('boom'));
		expect(response.status).toBe(500);
		expect(body.code).toBe('internal_error');
	});
});

describe('parseMonthOrThrow', () => {
	it('parses a valid YYYYMM', () => {
		expect(parseMonthOrThrow('202501')).toBe(202501);
	});

	it('rejects a missing or out-of-range month with a 400', () => {
		expect(() => parseMonthOrThrow(null)).toThrow();
		expect(() => parseMonthOrThrow('202513')).toThrow();
		expect(() => parseMonthOrThrow('nope')).toThrow();
	});
});
