import { verify } from "@node-rs/argon2";
import { hashPassword } from "$db/auth";

export async function verifyPassword({
	passwordHash,
	password,
}: {
	passwordHash: string;
	password: string;
}): Promise<boolean> {
	return verify(passwordHash, password);
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it("verifyPassword - returns true for matching password", async () => {
		const password = "password123";
		const passwordHash = await hashPassword({ password });

		await expect(
			verifyPassword({
				passwordHash,
				password,
			}),
		).resolves.toBe(true);
	});

	it("verifyPassword - returns false for non-matching password", async () => {
		const passwordHash = await hashPassword({ password: "password123" });

		await expect(
			verifyPassword({
				passwordHash,
				password: "password124",
			}),
		).resolves.toBe(false);
	});

	it("verifyPassword - accepts multiple hashes for the same password", async () => {
		const password = "password123";
		const firstHash = await hashPassword({ password });
		const secondHash = await hashPassword({ password });

		expect(firstHash).not.toBe(secondHash);
		await expect(
			verifyPassword({
				passwordHash: firstHash,
				password,
			}),
		).resolves.toBe(true);
		await expect(
			verifyPassword({
				passwordHash: secondHash,
				password,
			}),
		).resolves.toBe(true);
	});
}
