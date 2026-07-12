import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { error, redirect } from '@sveltejs/kit';

// Limit for requested(...) single-flight refreshes. Clients pass query
// functions to .updates(...), which requests a refresh for every live
// instance — including stale ones from client-side navigation that are only
// evicted on GC, so more than one instance per query is legitimate. Payloads
// beyond the limit are rejected with a 400 that puts the visible query into a
// failed state (stale UI, uncaught console error) — the limit must sit far
// above any realistic instance count. It stays finite only to cap the
// refresh work a single (authenticated) request can trigger.
export const REFRESH_LIMIT = 100;

export function requireAdmin() {
	const event = getRequestEvent();
	if (!event.locals.session) redirect(307, resolve('/login'));
	if (!event.locals.session.user.isAdmin) error(401);
	return [event.locals.session.user, event] as const;
}

export function requireUser() {
	const event = getRequestEvent();
	if (!event.locals.session) redirect(307, resolve('/login'));
	return [event.locals.session.user, event] as const;
}
