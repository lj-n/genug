import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { createDatabase, type Database } from "$db";
import { createUser } from "$db/user";
import {
	createSession,
	createSessionToken,
	hashPassword,
	refreshSession,
	type Session,
} from "$db/auth";

export async function validateSession({
	database,
	sessionToken,
}: {
	database: Database;
	sessionToken: string;
}): Promise<Session | null> {
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

	return refreshSession({ database, session: session as Session });
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
		const sessionToken = createSessionToken();

		const username = "testuser";
		const passwordHash = await hashPassword({ password: "password123" });
		const user = await createUser({
			database,
			username,
			passwordHash,
		});

		const session = await createSession({
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
