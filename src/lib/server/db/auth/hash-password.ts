import { hashOptions } from '$server/utils/hash-options';
import { hash } from '@node-rs/argon2';

export async function hashPassword({ password }: { password: string }): Promise<string> {
	return hash(password, hashOptions);
}
