import { auth, createDatabase, type Database, tables, users } from '$db';
import { err, ok, type Result } from '$server/utils/result';

import type { AuthFailure } from './types';

export async function authenticateUser({
	database,
	password,
	username
}: {
	database: Database;
	password: string;
	username: string;
}): Promise<Result<Omit<typeof tables.users.$inferSelect, 'passwordHash'>, AuthFailure>> {
	const user = await users.getUserByName({
		database,
		username,
		withPassword: true
	});

	if (!user) {
		return err('INVALID_CREDENTIALS');
	}

	const { passwordHash, ...userWithoutPassword } = user;

	const validPassword = await auth.verifyPassword({ password, passwordHash });

	if (!validPassword) {
		return err('INVALID_CREDENTIALS');
	}

	return ok(userWithoutPassword);
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('authenticateUser', async () => {
		const database = createDatabase(':memory:');
		const username = 'testuser';
		const password = 'password123';
		const passwordHash = await auth.hashPassword({ password });

		await users.createUser({ database, passwordHash, username });

		await expect(authenticateUser({ database, password, username })).resolves.toMatchObject({
			data: expect.objectContaining({
				username
			}),
			ok: true
		});

		await expect(
			authenticateUser({ database, password: 'wrongpassword', username })
		).resolves.toMatchObject({
			error: 'INVALID_CREDENTIALS',
			ok: false
		});

		await expect(
			authenticateUser({ database, password, username: 'nonexistent' })
		).resolves.toMatchObject({
			error: 'INVALID_CREDENTIALS',
			ok: false
		});
	});
}
