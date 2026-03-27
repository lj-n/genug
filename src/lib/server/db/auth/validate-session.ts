import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { auth, createDatabase, type Database, users } from "$db";

export async function validateSession({
	database,
	sessionToken,
}: {
	database: Database;
	sessionToken: string;
}): Promise<auth.Session | null> {
	const tokenBuffer = new TextEncoder().encode(sessionToken);
	const sessionId = encodeHexLowerCase(sha256(tokenBuffer));

	const session = await database.query.sessions.findFirst({
		where: { id: sessionId },
		columns: { userId: false },
		with: { user: { columns: { passwordHash: false } } },
	});

	if (!session || !session.user) {
		return null;
	}

	return auth.refreshSession({ database, session: session as auth.Session });
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it("validateSession - invalid token returns null", async () => {
		const database = createDatabase(":memory:");

		await expect(
			validateSession({
				database,
				sessionToken: "invalid-token",
			}),
		).resolves.toBeNull();
	});

	it("validateSession - valid session returns session data", async () => {
		const database = createDatabase(":memory:");
		const sessionToken = auth.createSessionToken();

		const username = "testuser";
		const passwordHash = await auth.hashPassword({
			password: "password123",
		});
		const user = await users.createUser({
			database,
			username,
			passwordHash,
		});

		const session = await auth.createSession({
			database,
			userId: user.id,
			sessionToken,
		});

		await expect(
			validateSession({
				database,
				sessionToken,
			}),
		).resolves.toMatchObject({
			id: session.id,
			user,
		});
	});
}
