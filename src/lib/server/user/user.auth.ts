import type { Session, User as AuthUser } from 'lucia';
import { auth } from '../auth';
import { db } from '../db';
import { schema } from '../schema';

export function useUserAuth() {
	async function createUser(
		username: string,
		password: string
	): Promise<{ user: AuthUser; session: Session }> {
		return db.transaction(async () => {
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

			db.insert(schema.userProfile)
				.values({
					userId: user.userId
				})
				.returning()
				.get();

			return { user, session };
		});
	}

	async function login(username: string, password: string): Promise<Session> {
		const key = await auth.useKey('username', username.toLowerCase(), password);
		return await auth.createSession({ userId: key.userId, attributes: {} });
	}

	return { createUser, login };
}
