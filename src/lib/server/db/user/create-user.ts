import { createDatabase, type Database, tables } from "$db";
import { hashPassword } from "../auth/hash-password";

export async function createUser({
    database,
    username,
    passwordHash,
}: {
    database: Database;
    username: string;
    passwordHash: string;
}): Promise<Omit<typeof tables.users.$inferSelect, "passwordHash">> {
    const [{ passwordHash: _, ...user }] = await database
        .insert(tables.users)
        .values({ username, passwordHash })
        .returning();

    return user;
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("createUser", async () => {
        const db = createDatabase(":memory:");
        const username = "testuser";
        const password = "password123";
        const passwordHash = await hashPassword({ password });

        const user = await createUser({ database: db, username, passwordHash });

        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("isAdmin", false);
        expect(user).toHaveProperty("username", username);
    });
}
