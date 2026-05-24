import { tables, users } from '$db';
import { desc } from 'drizzle-orm';

export function createAdminActions({ database }: { database: App.Database; user: App.User }) {
	return {
		removeUser({ userId }: { userId: string }) {
			users.deleteUser({ database, userId });
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
