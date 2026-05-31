import { tables, users } from '$db';
import { eq } from 'drizzle-orm';

export function createUserActions({ database, user }: { database: App.Database; user: App.User }) {
	return {
		async changePassword({ password }: { password: string }) {
			await users.setPassword({ database, password, userId: user.id });
		},

		changeUsername({ username }: { username: string }) {
			return database
				.update(tables.users)
				.set({ username })
				.where(eq(tables.users.id, user.id))
				.run();
		},

		deleteSessions() {
			return database.delete(tables.sessions).where(eq(tables.sessions.userId, user.id)).run();
		}
	};
}
