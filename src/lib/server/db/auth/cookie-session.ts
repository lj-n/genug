import type { RequestEvent } from '@sveltejs/kit';

export const SESSION_COOKIE_NAME = 'session_token' as const;

export function deleteSessionCookie({ event }: { event: RequestEvent }): void {
	event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export function setSessionCookie({
	event,
	expiresAt,
	sessionToken
}: {
	event: RequestEvent;
	expiresAt?: Date;
	sessionToken: string;
}): void {
	event.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
		expires: expiresAt,
		path: '/'
	});
}
