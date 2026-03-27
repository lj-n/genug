import type { Database, tables } from "$db";

type User = typeof tables.users.$inferSelect;
type UserWithoutPassword = Omit<User, "passwordHash">;

export async function getUserById(args: {
    database: Database;
    id: string;
    withPassword: true;
}): Promise<User | undefined>;
export async function getUserById(args: {
    database: Database;
    id: string;
    withPassword?: false;
}): Promise<UserWithoutPassword | undefined>;
export async function getUserById(
    { database, id, withPassword = false }: {
        database: Database;
        id: string;
        withPassword?: boolean;
    },
): Promise<User | UserWithoutPassword | undefined> {
    if (withPassword) {
        return await database.query.users.findFirst({
            where: { id },
        });
    }

    return await database.query.users.findFirst({
        where: { id },
        columns: { passwordHash: false },
    });
}

export async function getUserByName(args: {
    database: Database;
    username: string;
    withPassword: true;
}): Promise<User | undefined>;
export async function getUserByName(args: {
    database: Database;
    username: string;
    withPassword?: false;
}): Promise<UserWithoutPassword | undefined>;
export async function getUserByName(
    { database, username, withPassword = false }: {
        database: Database;
        username: string;
        withPassword?: boolean;
    },
): Promise<User | UserWithoutPassword | undefined> {
    if (withPassword) {
        return await database.query.users.findFirst({
            where: { username },
        });
    }

    return await database.query.users.findFirst({
        where: { username },
        columns: { passwordHash: false },
    });
}
