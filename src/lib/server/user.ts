import type { Session, User } from 'lucia';
import { auth } from './auth';

/**
 * Creates a user and key in the database.
 */
export async function createUser(
	email: string,
	name: string,
	password: string,
	/** Set to `true` if the user should be verified at creation */
	verified = false
): Promise<User> {
	return await auth.createUser({
		key: {
			providerId: 'email',
			providerUserId: email.toLowerCase(),
			password
		},
		attributes: {
			email: email.toLowerCase(),
			email_verified: Number(verified),
			name
		}
	});
}

/**
 * Uses a users key to create a session.
 */
export async function loginUser(
	email: string,
	password: string
): Promise<Session> {
	const key = await auth.useKey('email', email.toLowerCase(), password);

	return await auth.createSession({
		userId: key.userId,
		attributes: {}
	});
}

