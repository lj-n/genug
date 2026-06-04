import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { error, redirect } from '@sveltejs/kit';

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
