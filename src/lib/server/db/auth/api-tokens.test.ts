import { createDatabase, type Database } from '$db';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
	createApiToken,
	createApiTokenSecret,
	deleteApiToken,
	listApiTokens,
	validateApiToken
} from './api-tokens';
import { hashPassword } from './index';
import { createUser } from './user';
import { DAY_IN_MS, type User } from './utils';

async function createUserForTest(db: Database, username = 'testuser'): Promise<User> {
	const passwordHash = await hashPassword({ password: 'password123' });
	return createUser({ db, passwordHash, username });
}

it('createApiToken - stores only a hash of the token', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);

	const { apiToken, token } = createApiToken({ db, name: 'iPhone', userId: user.id });
	const stored = await db.query.apiTokens.findFirst({ where: { id: apiToken.id } });

	expect(stored?.tokenHash).toBeDefined();
	expect(stored?.tokenHash).not.toBe(token);
	expect(stored?.expiresAt).toBeNull();
});

it('createApiToken - throws when userId does not exist', () => {
	const db = createDatabase(':memory:');

	expect(() => createApiToken({ db, name: 'iPhone', userId: 'non-existent-user-id' })).toThrow();
});

it('createApiTokenSecret - produces 44-char base64 token', () => {
	const token = createApiTokenSecret();
	expect(token).toHaveLength(44);
	expect(token).toMatch(/^[A-Za-z0-9+/]+=*$/);
});

it('validateApiToken - valid token returns the user without passwordHash', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const { token } = createApiToken({ db, name: 'iPhone', userId: user.id });

	const validated = await validateApiToken({ db, token });

	expect(validated).toMatchObject({ id: user.id, username: user.username });
	expect(validated).not.toHaveProperty('passwordHash');
});

it('validateApiToken - invalid token returns null', async () => {
	const db = createDatabase(':memory:');

	await expect(validateApiToken({ db, token: 'invalid-token' })).resolves.toBeNull();
});

it('validateApiToken - updates lastUsedAt', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const { apiToken, token } = createApiToken({ db, name: 'iPhone', userId: user.id });

	expect(apiToken.lastUsedAt).toBeNull();

	await validateApiToken({ db, token });
	const stored = await db.query.apiTokens.findFirst({ where: { id: apiToken.id } });

	expect(stored?.lastUsedAt?.getTime()).toBe(Date.now());
});

it('validateApiToken - token without expiry never expires', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const { token } = createApiToken({ db, name: 'iPhone', userId: user.id });

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 365 * 10));

	await expect(validateApiToken({ db, token })).resolves.toMatchObject({ id: user.id });
});

it('validateApiToken - expired token returns null and is deleted', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
	const { apiToken, token } = createApiToken({ db, expiresAt, name: 'iPhone', userId: user.id });

	vi.setSystemTime(expiresAt);

	await expect(validateApiToken({ db, token })).resolves.toBeNull();
	await expect(
		db.query.apiTokens.findFirst({ where: { id: apiToken.id } })
	).resolves.toBeUndefined();
});

it('validateApiToken - token before its expiry validates', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
	const { token } = createApiToken({ db, expiresAt, name: 'iPhone', userId: user.id });

	vi.setSystemTime(new Date(expiresAt.getTime() - 1));

	await expect(validateApiToken({ db, token })).resolves.toMatchObject({ id: user.id });
});

it('deleteApiToken - revoked token no longer validates', async () => {
	const db = createDatabase(':memory:');
	const user = await createUserForTest(db);
	const { apiToken, token } = createApiToken({ db, name: 'iPhone', userId: user.id });

	deleteApiToken({ db, tokenId: apiToken.id, userId: user.id });

	await expect(validateApiToken({ db, token })).resolves.toBeNull();
});

it('deleteApiToken - ignores tokens belonging to another user', async () => {
	const db = createDatabase(':memory:');
	const owner = await createUserForTest(db, 'owner');
	const other = await createUserForTest(db, 'other');
	const { apiToken, token } = createApiToken({ db, name: 'iPhone', userId: owner.id });

	deleteApiToken({ db, tokenId: apiToken.id, userId: other.id });

	await expect(validateApiToken({ db, token })).resolves.toMatchObject({ id: owner.id });
});

it('listApiTokens - returns only the user tokens, without tokenHash', async () => {
	const db = createDatabase(':memory:');
	const owner = await createUserForTest(db, 'owner');
	const other = await createUserForTest(db, 'other');
	createApiToken({ db, name: 'iPhone', userId: owner.id });
	createApiToken({ db, name: 'iPad', userId: owner.id });
	createApiToken({ db, name: 'Android', userId: other.id });

	const tokens = await listApiTokens({ db, userId: owner.id });

	expect(tokens).toHaveLength(2);
	expect(tokens.map((t) => t.name).sort()).toEqual(['iPad', 'iPhone']);
	for (const token of tokens) {
		expect(token).not.toHaveProperty('tokenHash');
	}
});

beforeEach(() => {
	vi.useFakeTimers({ now: 0 });
});

afterEach(() => {
	vi.useRealTimers();
});
