import { createDatabase } from '$db';
import { expect, it } from 'vitest';

import { hashPassword } from './index';
import { createUser, deleteUser, isFirstUser } from './user';

it('createUser - creates user with correct properties', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });

	const user = createUser({ db, passwordHash, username });

	expect(user).toHaveProperty('id');
	expect(user).toHaveProperty('createdAt');
	expect(user).toHaveProperty('isAdmin', false);
	expect(user).toHaveProperty('username', username);
});

it('createUser - throws on duplicate username', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });

	createUser({ db, passwordHash, username });

	expect(() => createUser({ db, passwordHash, username })).toThrow();
});

it('deleteUser - removes user from db', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });

	deleteUser({ db, userId: user.id });

	await expect(db.query.users.findFirst({ where: { id: user.id } })).resolves.toBeUndefined();
});

it('isFirstUser - returns true on empty db, false after first user', async () => {
	const db = createDatabase(':memory:');

	await expect(isFirstUser({ db })).resolves.toBe(true);

	const passwordHash = await hashPassword({ password: 'password123' });
	createUser({ db, passwordHash, username: 'testuser' });

	await expect(isFirstUser({ db })).resolves.toBe(false);
});
