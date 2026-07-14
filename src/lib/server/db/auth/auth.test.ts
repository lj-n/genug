import type { Cookies } from '@sveltejs/kit';

import { createDatabase, type Database } from '$db';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
	authenticateUser,
	createSession,
	createSessionToken,
	deleteSession,
	deleteSessionCookie,
	deleteUserSessions,
	getSessionCookie,
	hashPassword,
	refreshSession,
	setSessionCookie,
	validateSession
} from './index';
import { createUser } from './user';
import { DAY_IN_MS, InvalidCredentialsError, type Session, SESSION_COOKIE_NAME } from './utils';

async function createSessionForTest(db: Database): Promise<Session> {
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: crypto.randomUUID() });
	const { session } = createSession({ db, userId: user.id });
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
	createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({ username });
});

it('authenticateUser - throws on wrong password', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });
	createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password: 'wrongpassword', username })).rejects.toThrow(
		InvalidCredentialsError
	);
});

it('authenticateUser - throws for nonexistent user', async () => {
	const db = createDatabase(':memory:');

	await expect(
		authenticateUser({ db, password: 'password123', username: 'nonexistent' })
	).rejects.toThrow(InvalidCredentialsError);
});

it('createSession - throws when userId does not exist', () => {
	const db = createDatabase(':memory:');

	expect(() => createSession({ db, userId: 'non-existent-user-id' })).toThrow();
});

it('createSession - creates session for valid userId', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });

	const result = createSession({ db, userId: user.id });
	expect(result).toMatchObject({ session: { userId: user.id } });
});

it('createSessionToken - produces 16-char base64 token', () => {
	const token = createSessionToken();
	expect(token).toHaveLength(16);
	expect(token).toMatch(/^[A-Za-z0-9+/]+$/);
});

it('deleteSession - removes an existing session', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });
	const { session } = createSession({ db, userId: user.id });

	deleteSession({ db, sessionId: session.id });

	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('deleteSession - ignores missing session ids', () => {
	const db = createDatabase(':memory:');

	expect(deleteSession({ db, sessionId: 'missing-session-id' })).toBeUndefined();
});

it('deleteUserSessions - removes every session belonging to a user', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });
	createSession({ db, userId: user.id });
	createSession({ db, userId: user.id });

	deleteUserSessions({ db, userId: user.id });

	await expect(
		db.query.sessions.findFirst({ where: { userId: user.id } })
	).resolves.toBeUndefined();
});

it('setSessionCookie / getSessionCookie / deleteSessionCookie - round-trip via Cookies', () => {
	const store = new Map<string, string>();
	const cookies = {
		delete: (name: string) => store.delete(name),
		get: (name: string) => store.get(name),
		set: (name: string, value: string) => store.set(name, value)
	} as unknown as Cookies;

	const expiresAt = new Date(DAY_IN_MS * 20);
	setSessionCookie({ cookies, expiresAt, sessionToken: 'token-value' });
	expect(store.get(SESSION_COOKIE_NAME)).toBe('token-value');
	expect(getSessionCookie({ cookies })).toBe('token-value');

	deleteSessionCookie({ cookies });
	expect(getSessionCookie({ cookies })).toBeUndefined();
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

	const refreshed = refreshSession({ db, session });
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

	const refreshed = refreshSession({ db, session });
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

	const refreshed = refreshSession({ db, session });
	const stored = await db.query.sessions.findFirst({ where: { id: session.id } });

	expect(refreshed).not.toBeNull();
	expect(refreshed?.expiresAt.getTime()).toBe(expectedExpiresAt);
	expect(stored?.expiresAt.getTime()).toBe(expectedExpiresAt);
});

it('refreshSession - expires at exactly Date.now()', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(session.expiresAt);

	expect(refreshSession({ db, session })).toBeNull();
	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('refreshSession - deletes expired sessions', async () => {
	const db = createDatabase(':memory:');
	const session = await createSessionForTest(db);

	vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 21));

	expect(refreshSession({ db, session })).toBeNull();
	await expect(db.query.sessions.findFirst({ where: { id: session.id } })).resolves.toBeUndefined();
});

it('validateSession - invalid token returns null', async () => {
	const db = createDatabase(':memory:');

	await expect(validateSession({ db, sessionToken: 'invalid-token' })).resolves.toBeNull();
});

it('validateSession - valid session returns session data', async () => {
	const db = createDatabase(':memory:');
	const passwordHash = await hashPassword({ password: 'password123' });
	const user = createUser({ db, passwordHash, username: 'testuser' });
	const { session, sessionToken } = createSession({ db, userId: user.id });

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
	createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({ username });
});

it('hashPassword - wrong password is rejected', async () => {
	const db = createDatabase(':memory:');
	const username = 'testuser';
	const passwordHash = await hashPassword({ password: 'password123' });
	createUser({ db, passwordHash, username });

	await expect(authenticateUser({ db, password: 'password124', username })).rejects.toThrow(
		InvalidCredentialsError
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
		createUser({ db, passwordHash, username });
		await expect(authenticateUser({ db, password, username })).resolves.toMatchObject({
			username
		});
	}
});
