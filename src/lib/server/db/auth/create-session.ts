import { encodeHexLowerCase } from "@oslojs/encoding";
import { createDatabase, type Database, tables } from "..";
import { sha256 } from "@oslojs/crypto/sha2";
import { createSessionToken } from "./create-session-token";
import { createUser } from "../user/create-user";
import { hashPassword } from "./hash-password";

export async function createSession(
    { database, sessionToken, userId }: {
        database: Database;
        sessionToken: string;
        userId: string;
    },
): Promise<typeof tables.sessions.$inferSelect> {
    const tokenBuffer = new TextEncoder().encode(sessionToken);
    const sessionId = encodeHexLowerCase(sha256(tokenBuffer));

    const [session] = await database
        .insert(tables.sessions)
        .values({ id: sessionId, userId }).returning();

    return session;
}

if (import.meta.vitest) {
    const { it, expect, beforeEach, afterEach, vi } = import.meta.vitest;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("createSession", async () => {
        const database = createDatabase(":memory:");
        const sessionToken = createSessionToken();

        await expect(
            createSession({
                database,
                userId: "user-id",
                sessionToken,
            }),
        ).rejects.toThrow();

        const username = "testuser";
        const passwordHash = await hashPassword({ password: "password123" });
        const user = await createUser({
            database,
            username,
            passwordHash,
        });

        await expect(
            createSession({
                database,
                userId: user.id,
                sessionToken,
            }),
        ).resolves.toMatchObject({
            userId: user.id,
        });
    });
}
