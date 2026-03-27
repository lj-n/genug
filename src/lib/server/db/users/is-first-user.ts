import { auth, createDatabase, type Database, tables, users } from "$db";

export async function isFirstUser(
    { database }: { database: Database },
): Promise<boolean> {
    return (await database.$count(tables.users)) === 0;
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("isFirstUser", async () => {
        const database = createDatabase(":memory:");

        await expect(isFirstUser({ database })).resolves.toBe(true);

        const username = "testuser";
        const password = "password123";
        const passwordHash = await auth.hashPassword({ password });

        await users.createUser({ database, username, passwordHash });

        await expect(isFirstUser({ database })).resolves.toBe(false);
    });
}
