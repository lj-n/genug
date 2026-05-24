import { tables, users } from '$db';
import { createId } from '$server/utils/create-id';
import { desc } from 'drizzle-orm';

export function createAdminActions({ database }: { database: App.Database; user: App.User }) {
	return {
		removeUser({ userId }: { userId: string }) {
			users.deleteUser({ database, userId });
		},

		async resetUserPassword({ userId }: { userId: string }) {
			const password = createId();
			await users.setPassword({ database, password, userId });
			return password;
		},

		users() {
			return database
				.select({
					id: tables.users.id,
					name: tables.users.username
				})
				.from(tables.users)
				.orderBy(desc(tables.users.isAdmin))
				.all();
		}
	};
}
