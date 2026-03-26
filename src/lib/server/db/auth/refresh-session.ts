import { createDatabase, type Database, tables } from "$db";
import { DAY_IN_MS } from "$server/utils/day-in-ms";
import { eq } from "drizzle-orm";
import type { Session } from ".";
import { createUser } from "../user/create-user";
import { createSession } from "./create-session";
import { createSessionToken } from "./create-session-token";
import { deleteSession } from "./delete-session";
import { hashPassword } from "./hash-password";

export async function refreshSession({
    database,
    session,
}: {
    database: Database;
    session: Session;
}): Promise<Session | null> {
    if (isExpired(session.expiresAt)) {
        await deleteSession({ database, sessionId: session.id });
        return null;
    }

    if (shouldRefresh(session.expiresAt)) {
        session.expiresAt = new Date(Date.now() + DAY_IN_MS * 15); // Extend session by 15 days
        await database
            .update(tables.sessions)
            .set({ expiresAt: session.expiresAt })
            .where(eq(tables.sessions.id, session.id));
    }

    return session;
}

function isExpired(expiresAt: Date) {
    return expiresAt.getTime() <= Date.now();
}

/**
 * Determines if a session should be refreshed based on its expiration time.
 * A session should be refreshed if it is set to expire within the next 10 days.
 */
function shouldRefresh(expiresAt: Date) {
    return expiresAt.getTime() - DAY_IN_MS * 10 <= Date.now();
}

if (import.meta.vitest) {
    const { it, expect, beforeEach, afterEach, vi } = import.meta.vitest;

    async function createSessionForRefreshTest(
        database: Database,
    ): Promise<Session> {
        const passwordHash = await hashPassword({ password: "password123" });
        const user = await createUser({
            database,
            username: crypto.randomUUID(),
            passwordHash,
        });
        const createdSession = await createSession({
            database,
            userId: user.id,
            sessionToken: createSessionToken(),
        });
        const storedSession = await database.query.sessions.findFirst({
            where: { id: createdSession.id },
            columns: { userId: false },
            with: { user: { columns: { passwordHash: false } } },
        });

        if (!storedSession) {
            throw new Error("Session not found");
        }

        return storedSession as Session;
    }

    beforeEach(() => {
        vi.useFakeTimers({ now: 0 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("refreshSession - refreshes at exactly the 10 day boundary", async () => {
        const database = createDatabase(":memory:");
        const session = await createSessionForRefreshTest(database);

        vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 10));
        const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

        const refreshedSession = await refreshSession({
            database,
            session,
        });
        const storedSession = await database.query.sessions.findFirst({
            where: { id: session.id },
        });

        expect(refreshedSession).not.toBeNull();
        expect(refreshedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
        expect(storedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
    });

    it("refreshSession - does not refresh before the 10 day boundary", async () => {
        const database = createDatabase(":memory:");
        const session = await createSessionForRefreshTest(database);
        const originalExpiresAt = session.expiresAt;

        vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 9));

        const refreshedSession = await refreshSession({
            database,
            session,
        });
        const storedSession = await database.query.sessions.findFirst({
            where: { id: session.id },
        });

        expect(refreshedSession).not.toBeNull();
        expect(refreshedSession?.expiresAt.getTime()).toBe(
            originalExpiresAt.getTime(),
        );
        expect(storedSession?.expiresAt.getTime()).toBe(
            originalExpiresAt.getTime(),
        );
    });

    it("refreshSession - extends sessions inside the refresh window", async () => {
        const database = createDatabase(":memory:");
        const session = await createSessionForRefreshTest(database);

        vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 11));
        const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

        const refreshedSession = await refreshSession({
            database,
            session,
        });
        const storedSession = await database.query.sessions.findFirst({
            where: { id: session.id },
        });

        expect(refreshedSession).not.toBeNull();
        expect(refreshedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
        expect(storedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
    });

    it("refreshSession - expires at exactly Date.now()", async () => {
        const database = createDatabase(":memory:");
        const session = await createSessionForRefreshTest(database);

        vi.setSystemTime(session.expiresAt);

        await expect(
            refreshSession({
                database,
                session,
            }),
        ).resolves.toBeNull();
        await expect(
            database.query.sessions.findFirst({ where: { id: session.id } }),
        ).resolves.toBeUndefined();
    });

    it("refreshSession - deletes expired sessions", async () => {
        const database = createDatabase(":memory:");
        const session = await createSessionForRefreshTest(database);

        vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 21));

        await expect(
            refreshSession({
                database,
                session,
            }),
        ).resolves.toBeNull();
        await expect(
            database.query.sessions.findFirst({ where: { id: session.id } }),
        ).resolves.toBeUndefined();
    });
}
