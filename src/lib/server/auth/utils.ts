import type { User } from 'lucia';
import { SqliteError } from 'better-sqlite3';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { getUserSettings } from './user';
import { db } from '../db';
import type { schema } from '../schema';

/**
 * Checks if the given error indicates that a name is already in use.
 *
 * @param e The error object to check.
 * @returns True if the error indicates a name already in use, false otherwise.
 */
export function isNameAlreadyInUse(e: unknown) {
	return e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

/**
 * Protects a route by validating the user's session and providing the current user's profile.
 *
 * @param fn The function to execute if the route is protected.
 * @param redirectTo The URL to redirect to if the user is not authenticated. Default is '/signin'.
 * @returns A promise that resolves to the result of the protected route function.
 */
export function protectRoute<Event extends RequestEvent, Out>(
	fn: (
		event: Event,
		currentUser: User &
			Omit<typeof schema.userSettings.$inferSelect, 'id' | 'userId'>
	) => Out,
	{ redirectTo = '/signin' }: { redirectTo?: string } = {}
) {
	return async (event: Event): Promise<Out> => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, redirectTo);
		}

		const profile = getUserSettings(db, user.id);

		return fn(event, { ...user, ...profile });
	};
}
