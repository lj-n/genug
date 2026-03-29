import { auth, createDatabase, type Database, users } from '$db';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export async function validateSession({
	database,
	sessionToken
}: {
	database: Database;
	sessionToken: string;
}): Promise<auth.Session | null> {
	const tokenBuffer = new TextEncoder().encode(sessionToken);
	const sessionId = encodeHexLowerCase(sha256(tokenBuffer));

	const session = await database.query.sessions.findFirst({
		columns: { userId: false },
		where: { id: sessionId },
		with: { user: { columns: { passwordHash: false } } }
	});

	if (!session || !session.user) {
		return null;
	}

	return auth.refreshSession({ database, session: session as auth.Session });
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('validateSession - invalid token returns null', async () => {
		const database = createDatabase(':memory:');

		await expect(
			validateSession({
				database,
				sessionToken: 'invalid-token'
			})
		).resolves.toBeNull();
	});

	it('validateSession - valid session returns session data', async () => {
		const database = createDatabase(':memory:');
		const sessionToken = auth.createSessionToken();

		const username = 'testuser';
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});
		const user = await users.createUser({
			database,
			passwordHash,
			username
		});

		const session = await auth.createSession({
			database,
			sessionToken,
			userId: user.id
		});

		await expect(
			validateSession({
				database,
				sessionToken
			})
		).resolves.toMatchObject({
			id: session.id,
			user
		});
	});
}
