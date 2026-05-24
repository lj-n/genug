import { auth, type Database, tables } from '$db';
import { eq } from 'drizzle-orm';

export async function setPassword({
	database,
	password,
	userId
}: {
	database: Database;
	password: string;
	userId: string;
}) {
	const passwordHash = await auth.hashPassword({ password });
	database.update(tables.users).set({ passwordHash }).where(eq(tables.users.id, userId)).run();
}
