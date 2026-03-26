import { verify } from "@node-rs/argon2";

export async function verifyPassword({
    passwordHash,
    password,
}: {
    passwordHash: string;
    password: string;
}): Promise<boolean> {
    return verify(passwordHash, password);
}
