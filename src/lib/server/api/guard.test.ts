import type { RequestEvent } from '@sveltejs/kit';

import { error } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';

import { withApi } from './guard';

/** A minimal event carrying only what `withApi` reads. */
function makeEvent(options: { header?: string; user?: null | { id: string } } = {}): RequestEvent {
	const headers = new Headers();
	if (options.header) headers.set('x-genug-client', options.header);
	return {
		locals: { user: options.user ?? null },
		request: new Request('http://localhost/api/v1/budgets', { headers })
	} as unknown as RequestEvent;
}

describe('withApi', () => {
	it('rejects a request without a valid token as 401 unauthorized', async () => {
		const handler = withApi(async () => ({ body: { ok: true }, status: 200 }));
		const response = await handler(makeEvent({ user: null }));
		expect(response.status).toBe(401);
		expect(((await response.json()) as { code: string }).code).toBe('unauthorized');
	});

	it('runs the handler and serialises its body for an authenticated request', async () => {
		const handler = withApi(async ({ user }) => ({ body: { userId: user.id }, status: 200 }));
		const response = await handler(makeEvent({ user: { id: 'user_1' } }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ userId: 'user_1' });
	});

	it('translates a thrown domain error into the contract error envelope', async () => {
		const handler = withApi(async () => {
			error(404, 'nope');
		});
		const response = await handler(makeEvent({ user: { id: 'user_1' } }));
		expect(response.status).toBe(404);
		expect((await response.json()) as { code: string; message: string }).toEqual({
			code: 'not_found',
			message: 'nope'
		});
	});
});
