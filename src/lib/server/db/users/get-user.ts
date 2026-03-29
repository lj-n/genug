import type { Database, tables } from '$db';

type User = typeof tables.users.$inferSelect;
type UserWithoutPassword = Omit<User, 'passwordHash'>;

export async function getUserById(args: {
	database: Database;
	id: string;
	withPassword: true;
}): Promise<undefined | User>;
export async function getUserById(args: {
	database: Database;
	id: string;
	withPassword?: false;
}): Promise<undefined | UserWithoutPassword>;
export async function getUserById({
	database,
	id,
	withPassword = false
}: {
	database: Database;
	id: string;
	withPassword?: boolean;
}): Promise<undefined | User | UserWithoutPassword> {
	if (withPassword) {
		return await database.query.users.findFirst({
			where: { id }
		});
	}

	return await database.query.users.findFirst({
		columns: { passwordHash: false },
		where: { id }
	});
}

export async function getUserByName(args: {
	database: Database;
	username: string;
	withPassword: true;
}): Promise<undefined | User>;
export async function getUserByName(args: {
	database: Database;
	username: string;
	withPassword?: false;
}): Promise<undefined | UserWithoutPassword>;
export async function getUserByName({
	database,
	username,
	withPassword = false
}: {
	database: Database;
	username: string;
	withPassword?: boolean;
}): Promise<undefined | User | UserWithoutPassword> {
	if (withPassword) {
		return await database.query.users.findFirst({
			where: { username }
		});
	}

	return await database.query.users.findFirst({
		columns: { passwordHash: false },
		where: { username }
	});
}
