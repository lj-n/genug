/**
 * Auth, client-version, and error boundary shared by every native-client
 * route (map #190, ticket #195). Wrapping a handler in `withApi` keeps the
 * `+server.ts` files thin: they parse their params and body, then return a
 * status + body; this wrapper owns everything cross-cutting.
 *
 * Authentication is the `Bearer` path `hooks.server.ts` already populates —
 * a valid PAT sets `locals.user` (with `locals.session === null`); a missing
 * or invalid token leaves it null and earns a 401 here. Access control below
 * the user is still enforced inside `user-context` by `accessGuard()` /
 * `ownerGuard()`, exactly as for the web app.
 */

import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

import { database } from '$db';
import { createUserCtx, type UserCtx } from '$db/user-context';
import { json } from '@sveltejs/kit';

import { apiError, clientVersionIssue, toErrorResponse } from './respond';

type ApiHandler = (args: {
	ctx: UserCtx;
	event: RequestEvent;
	user: NonNullable<App.Locals['user']>;
}) => Promise<{ body: unknown; status: number }>;

export function withApi(handler: ApiHandler): RequestHandler {
	return async (event) => {
		const versionIssue = clientVersionIssue(event.request.headers.get('x-genug-client'));
		if (versionIssue) return apiError(426, 'client_upgrade_required', versionIssue);

		const user = event.locals.user;
		if (!user) return apiError(401, 'unauthorized', 'Missing, invalid, expired, or revoked token.');

		try {
			const ctx = createUserCtx(user.id, database);
			const { body, status } = await handler({ ctx, event, user });
			return json(body, { status });
		} catch (err) {
			return toErrorResponse(err, event.locals.logger);
		}
	};
}
