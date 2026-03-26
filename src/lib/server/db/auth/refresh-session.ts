import { type Database, tables } from "$db";
import { DAY_IN_MS } from "$server/utils/day-in-ms";
import { eq } from "drizzle-orm";
import type { Session } from ".";
import { deleteSession } from "./delete-session";

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
    return expiresAt.getTime() < Date.now();
}

/**
 * Determines if a session should be refreshed based on its expiration time.
 * A session should be refreshed if it is set to expire within the next 10 days.
 */
function shouldRefresh(expiresAt: Date) {
    return expiresAt.getTime() - DAY_IN_MS * 10 < Date.now();
}
