import { type Database, tables } from "$db";
import { eq } from "drizzle-orm";
import { createDatabase } from "..";
import { createUser } from "../user/create-user";
import { createSession } from "./create-session";
import { createSessionToken } from "./create-session-token";
import { hashPassword } from "./hash-password";

export async function deleteSession({
    database,
    sessionId,
}: {
    database: Database;
    sessionId: string;
}): Promise<void> {
    await database.delete(tables.sessions)
        .where(eq(tables.sessions.id, sessionId));
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("deleteSession - removes an existing session", async () => {
        const database = createDatabase(":memory:");
        const passwordHash = await hashPassword({ password: "password123" });
        const user = await createUser({
            database,
            username: "testuser",
            passwordHash,
        });
        const session = await createSession({
            database,
            userId: user.id,
            sessionToken: createSessionToken(),
        });

        await deleteSession({ database, sessionId: session.id });

        await expect(
            database.query.sessions.findFirst({ where: { id: session.id } }),
        ).resolves.toBeUndefined();
    });

    it("deleteSession - ignores missing session ids", async () => {
        const database = createDatabase(":memory:");

        await expect(
            deleteSession({ database, sessionId: "missing-session-id" }),
        ).resolves.toBeUndefined();
    });
}
