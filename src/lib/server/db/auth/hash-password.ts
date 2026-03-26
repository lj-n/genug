import { hash } from "@node-rs/argon2";
import { hashOptions } from "$server/utils/hash-options";

export async function hashPassword(
    { password }: { password: string },
): Promise<string> {
    return hash(password, hashOptions);
}
