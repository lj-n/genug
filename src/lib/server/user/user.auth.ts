import type { Session, User as AuthUser } from 'lucia';
import { auth } from '../auth';

export function useUserAuth() {
	async function createUser(
		username: string,
		password: string
	): Promise<{ user: AuthUser; session: Session }> {
		const user = await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: username.toLowerCase(),
				password
			},
			attributes: { name: username }
		});

		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});

		return { user, session };
	}

	async function login(username: string, password: string): Promise<Session> {
		const key = await auth.useKey('username', username.toLowerCase(), password);
		return await auth.createSession({ userId: key.userId, attributes: {} });
	}

	return { createUser, login };
}
