import { auth, createDatabase, type Database, tables, users } from '$db';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export async function createSession({
	database,
	sessionToken,
	userId
}: {
	database: Database;
	sessionToken: string;
	userId: string;
}): Promise<typeof tables.sessions.$inferSelect> {
	const tokenBuffer = new TextEncoder().encode(sessionToken);
	const sessionId = encodeHexLowerCase(sha256(tokenBuffer));

	const [session] = await database
		.insert(tables.sessions)
		.values({ id: sessionId, userId })
		.returning();

	return session;
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('createSession', async () => {
		const database = createDatabase(':memory:');
		const sessionToken = auth.createSessionToken();

		await expect(
			createSession({
				database,
				sessionToken,
				userId: 'user-id'
			})
		).rejects.toThrow();

		const username = 'testuser';
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});
		const user = await users.createUser({
			database,
			passwordHash,
			username
		});

		await expect(
			createSession({
				database,
				sessionToken,
				userId: user.id
			})
		).resolves.toMatchObject({
			userId: user.id
		});
	});
}
