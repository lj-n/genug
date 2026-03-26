import { type Database, tables } from "$db";
import { eq } from "drizzle-orm";

export async function deleteSession({
    database,
    sessionId,
}: {
    database: Database;
    sessionId: string;
}): Promise<void> {
    await database
        .delete(tables.sessions)
        .where(eq(tables.sessions.id, sessionId));
}
