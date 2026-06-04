import { createDatabase, type Database } from '$db';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
	authenticateUser,
	createSession,
	createSessionToken,
	deleteSession,
	hashPassword,
	refreshSession,
	validateSession
} from './auth';
import { DAY_IN_MS, type Session } from './auth.utils';
import { createUser } from './user';

async function createSessionForTest(db: Database): Promise<Session> {
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = await createUser({ db, passwordHash, username: crypto.randomUUID() });
	const { session } = await createSession({ db, userId: user.id });
	const stored = await db.query.sessions.findFirst({
		columns: { userId: false },
		where: { id: session.id },
		with: { user: { columns: { passwordHash: false } } }
	});
	if (!stored) throw new Error('Session not found');
	return stored as Session;
}

it('authenticateUser - returns user on valid credentials', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const password = 'password123';
	const passwordHash = await hashPassword({ password });
	await createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({ username });
});

it('authenticateUser - throws on wrong password', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });
	await createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password: 'wrongpassword', username })).rejects.toThrow(
		'INVALID_CREDENTIALS'
	);
});

it('authenticateUser - throws for nonexistent user', async () => {
	const db = createDatabase(':memory:');

	await expect(
		authenticateUser({ db, password: 'password123', username: 'nonexistent' })
	).rejects.toThrow('INVALID_CREDENTIALS');
});

it('createSession - throws when userId does not exist', async () => {
	const db = createDatabase(':memory:');

	await expect(createSession({ db, userId: 'non-existent-user-id' })).rejects.toThrow();
});

it('createSession - creates session for valid userId', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = await createUser({ db, passwordHash, username: 'testuser' });

	await expect(createSession({ db, userId: user.id })).resolves.toMatchObject({
		session: { userId: user.id }
	});
});

it('createSessionToken - produces 16-char base64 token', () => {
	const token = createSessionToken();
	expect(token).toHaveLength(16);
	expect(token).toMatch(/^[A-Za-z0-9+/]+$/);
});

it('deleteSession - removes an existing session', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = await createUser({ db, passwordHash, username: 'testuser' });
	const { session } = await createSession({ db, userId: user.id });

	await deleteSession({ db, sessionId: session.id });

	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('deleteSession - ignores missing session ids', async () => {
	const db = createDatabase(':memory:');

	await expect(deleteSession({ db, sessionId: 'missing-session-id' })).resolves.toBeUndefined();
});

beforeEach(() => {
	vi.useFakeTimers({ now: 0 });
});

afterEach(() => {
	vi.useRealTimers();
});

it('refreshSession - refreshes at exactly the 10 day boundary', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 10));
	const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

	const refreshed = await refreshSession({ db, session });
	const stored = await db.query.sessions.findFirst({ where: { id: session.id } });

	expect(refreshed).not.toBeNull();
	expect(refreshed?.expiresAt.getTime()).toBe(expectedExpiresAt);
	expect(stored?.expiresAt.getTime()).toBe(expectedExpiresAt);
});

it('refreshSession - does not refresh before the 10 day boundary', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);
	const originalExpiresAt = session.expiresAt;

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 9));

	const refreshed = await refreshSession({ db, session });
	const stored = await db.query.sessions.findFirst({ where: { id: session.id } });

	expect(refreshed).not.toBeNull();
	expect(refreshed?.expiresAt.getTime()).toBe(originalExpiresAt.getTime());
	expect(stored?.expiresAt.getTime()).toBe(originalExpiresAt.getTime());
});

it('refreshSession - extends sessions inside the refresh window', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 11));
	const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

	const refreshed = await refreshSession({ db, session });
	const stored = await db.query.sessions.findFirst({ where: { id: session.id } });

	expect(refreshed).not.toBeNull();
	expect(refreshed?.expiresAt.getTime()).toBe(expectedExpiresAt);
	expect(stored?.expiresAt.getTime()).toBe(expectedExpiresAt);
});

it('refreshSession - expires at exactly Date.now()', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(session.expiresAt);

	await expect(refreshSession({ db, session })).resolves.toBeNull();
	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('refreshSession - deletes expired sessions', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 21));

	await expect(refreshSession({ db, session })).resolves.toBeNull();
	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('validateSession - invalid token returns null', async () => {
	const db = createDatabase(':memory:');

	await expect(validateSession({ db, sessionToken: 'invalid-token' })).resolves.toBeNull();
});

it('validateSession - valid session returns session data', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = await createUser({ db, passwordHash, username: 'testuser' });
	const { session, sessionToken } = await createSession({ db, userId: user.id });

	await expect(validateSession({ db, sessionToken })).resolves.toMatchObject({
		id: session.id,
		user
	});
});

it('hashPassword - correct password verifies successfully', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const password = 'password123';
	const passwordHash = await hashPassword({ password });
	await createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({ username });
});

it('hashPassword - wrong password is rejected', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });
	await createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password: 'password124', username })).rejects.toThrow(
		'INVALID_CREDENTIALS'
	);
});

it('hashPassword - multiple hashes for same password all verify', async () => {
	const db = createDatabase(':memory:');
	const password = 'password123';
	const firstHash = await hashPassword({ password });
	const secondHash = await hashPassword({ password });

	expect(firstHash).not.toBe(secondHash);

	for (const [i, passwordHash] of [firstHash, secondHash].entries()) {
		const username = `user${i}`;
		await createUser({ db, passwordHash, username });
		await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({
			username
		});
	}
});
