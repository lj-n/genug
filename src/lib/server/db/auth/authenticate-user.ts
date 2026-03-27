import { err, ok, type Result } from "$server/utils/result";
import { auth, createDatabase, type Database, tables, users } from "$db";
import type { AuthFailure } from "./types";

export async function authenticateUser(
    {
        database,
        username,
        password,
    }: {
        database: Database;
        username: string;
        password: string;
    },
): Promise<
    Result<Omit<typeof tables.users.$inferSelect, "passwordHash">, AuthFailure>
> {
    const user = await users.getUserByName({
        database,
        username,
        withPassword: true,
    });

    if (!user) {
        return err("INVALID_CREDENTIALS");
    }

    const { passwordHash, ...userWithoutPassword } = user;

    const validPassword = await auth.verifyPassword({ password, passwordHash });

    if (!validPassword) {
        return err("INVALID_CREDENTIALS");
    }

    return ok(userWithoutPassword);
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("authenticateUser", async () => {
        const database = createDatabase(":memory:");
        const username = "testuser";
        const password = "password123";
        const passwordHash = await auth.hashPassword({ password });

        await users.createUser({ database, username, passwordHash });

        await expect(
            authenticateUser({ database, username, password }),
        ).resolves.toMatchObject({
            ok: true,
            data: expect.objectContaining({
                username,
            }),
        });

        await expect(
            authenticateUser({ database, username, password: "wrongpassword" }),
        ).resolves.toMatchObject({
            ok: false,
            error: "INVALID_CREDENTIALS",
        });

        await expect(
            authenticateUser({ database, username: "nonexistent", password }),
        ).resolves.toMatchObject({
            ok: false,
            error: "INVALID_CREDENTIALS",
        });
    });
}
