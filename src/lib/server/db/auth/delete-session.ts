import { auth, createDatabase, type Database, tables, users } from '$db';
import { eq } from 'drizzle-orm';

export async function deleteSession({
	database,
	sessionId
}: {
	database: Database;
	sessionId: string;
}): Promise<void> {
	await database.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('deleteSession - removes an existing session', async () => {
		const database = createDatabase(':memory:');
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});
		const user = await users.createUser({
			database,
			passwordHash,
			username: 'testuser'
		});
		const session = await auth.createSession({
			database,
			sessionToken: auth.createSessionToken(),
			userId: user.id
		});

		await deleteSession({ database, sessionId: session.id });

		await expect(
			database.query.sessions.findFirst({ where: { id: session.id } })
		).resolves.toBeUndefined();
	});

	it('deleteSession - ignores missing session ids', async () => {
		const database = createDatabase(':memory:');

		await expect(
			deleteSession({ database, sessionId: 'missing-session-id' })
		).resolves.toBeUndefined();
	});
}
