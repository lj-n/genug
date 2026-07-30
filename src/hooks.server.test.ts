import { m } from '$lib/paraglide/messages';
import { describe, expect, it, vi } from 'vitest';

import { handleError } from './hooks.server';

/** Minimal stand-in for the request event handleError reads from. */
function eventWithLogger(logger: { error: ReturnType<typeof vi.fn> }) {
	return { locals: { logger } } as unknown as Parameters<typeof handleError>[0]['event'];
}

describe('handleError', () => {
	it('returns a localized not-found message with no logId for route 404s', () => {
		const logger = { error: vi.fn() };

		const result = handleError({
			error: new Error('Not Found'),
			event: eventWithLogger(logger),
			message: 'Not Found',
			status: 404
		});

		expect(result).toEqual({ message: m.error_page_not_found() });
		expect(result).not.toHaveProperty('logId');
		expect(logger.error).not.toHaveBeenCalled();
	});

	it('returns a logId and logs the error for unexpected 5xx errors', () => {
		const logger = { error: vi.fn() };

		const result = handleError({
			error: new Error('boom'),
			event: eventWithLogger(logger),
			message: 'Internal Error',
			status: 500
		}) as App.Error;

		expect(result.logId).toBeTruthy();
		expect(result.message).toBe('An unexpected error occurred.');
		expect(logger.error).toHaveBeenCalledOnce();
		expect(logger.error.mock.calls[0][0]).toMatchObject({ logId: result.logId, status: 500 });
	});
});
