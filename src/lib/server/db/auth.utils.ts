import type { tables } from '$db';

export function isExpired(expiresAt: Date) {
	return expiresAt.getTime() <= Date.now();
}

/**
 * Determines if a session should be refreshed based on its expiration time.
 * A session should be refreshed if it is set to expire within the next 10 days.
 */
export function shouldRefresh(expiresAt: Date) {
	return expiresAt.getTime() - DAY_IN_MS * 10 <= Date.now();
}

/**
 * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
 */
export const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * This type represents the session object that is attached to the locals of the event in the `handle` hook.
 */
export type Session = Omit<typeof tables.sessions.$inferSelect, 'userId'> & {
	user: Omit<typeof tables.users.$inferSelect, 'passwordHash'>;
};

export class InvalidCredentialsError extends Error {
	constructor() {
		super();
		this.name = 'InvalidCredentialsError';
	}
}

export const SESSION_COOKIE_NAME = 'session_token' as const;
