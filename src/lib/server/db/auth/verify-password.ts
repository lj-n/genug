import { auth } from '$db';
import { verify } from '@node-rs/argon2';

export async function verifyPassword({
	password,
	passwordHash
}: {
	password: string;
	passwordHash: string;
}): Promise<boolean> {
	return verify(passwordHash, password);
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('verifyPassword - returns true for matching password', async () => {
		const password = 'password123';
		const passwordHash = await auth.hashPassword({ password });

		await expect(
			verifyPassword({
				password,
				passwordHash
			})
		).resolves.toBe(true);
	});

	it('verifyPassword - returns false for non-matching password', async () => {
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});

		await expect(
			verifyPassword({
				password: 'password124',
				passwordHash
			})
		).resolves.toBe(false);
	});

	it('verifyPassword - accepts multiple hashes for the same password', async () => {
		const password = 'password123';
		const firstHash = await auth.hashPassword({ password });
		const secondHash = await auth.hashPassword({ password });

		expect(firstHash).not.toBe(secondHash);
		await expect(
			verifyPassword({
				password,
				passwordHash: firstHash
			})
		).resolves.toBe(true);
		await expect(
			verifyPassword({
				password,
				passwordHash: secondHash
			})
		).resolves.toBe(true);
	});
}
