import { auth, createDatabase, type Database, tables, users } from '$db';
import { DAY_IN_MS } from '$server/utils/day-in-ms';
import { eq } from 'drizzle-orm';

export async function refreshSession({
	database,
	session
}: {
	database: Database;
	session: auth.Session;
}): Promise<auth.Session | null> {
	if (isExpired(session.expiresAt)) {
		await auth.deleteSession({ database, sessionId: session.id });
		return null;
	}

	if (shouldRefresh(session.expiresAt)) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 15); // Extend session by 15 days
		await database
			.update(tables.sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(tables.sessions.id, session.id));
	}

	return session;
}

function isExpired(expiresAt: Date) {
	return expiresAt.getTime() <= Date.now();
}

/**
 * Determines if a session should be refreshed based on its expiration time.
 * A session should be refreshed if it is set to expire within the next 10 days.
 */
function shouldRefresh(expiresAt: Date) {
	return expiresAt.getTime() - DAY_IN_MS * 10 <= Date.now();
}

if (import.meta.vitest) {
	const { afterEach, beforeEach, expect, it, vi } = import.meta.vitest;

	async function createSessionForRefreshTest(database: Database): Promise<auth.Session> {
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});
		const user = await users.createUser({
			database,
			passwordHash,
			username: crypto.randomUUID()
		});
		const createdSession = await auth.createSession({
			database,
			sessionToken: auth.createSessionToken(),
			userId: user.id
		});
		const storedSession = await database.query.sessions.findFirst({
			columns: { userId: false },
			where: { id: createdSession.id },
			with: { user: { columns: { passwordHash: false } } }
		});

		if (!storedSession) {
			throw new Error('Session not found');
		}

		return storedSession as auth.Session;
	}

	beforeEach(() => {
		vi.useFakeTimers({ now: 0 });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('refreshSession - refreshes at exactly the 10 day boundary', async () => {
		const database = createDatabase(':memory:');
		const session = await createSessionForRefreshTest(database);

		vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 10));
		const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

		const refreshedSession = await refreshSession({
			database,
			session
		});
		const storedSession = await database.query.sessions.findFirst({
			where: { id: session.id }
		});

		expect(refreshedSession).not.toBeNull();
		expect(refreshedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
		expect(storedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
	});

	it('refreshSession - does not refresh before the 10 day boundary', async () => {
		const database = createDatabase(':memory:');
		const session = await createSessionForRefreshTest(database);
		const originalExpiresAt = session.expiresAt;

		vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 9));

		const refreshedSession = await refreshSession({
			database,
			session
		});
		const storedSession = await database.query.sessions.findFirst({
			where: { id: session.id }
		});

		expect(refreshedSession).not.toBeNull();
		expect(refreshedSession?.expiresAt.getTime()).toBe(originalExpiresAt.getTime());
		expect(storedSession?.expiresAt.getTime()).toBe(originalExpiresAt.getTime());
	});

	it('refreshSession - extends sessions inside the refresh window', async () => {
		const database = createDatabase(':memory:');
		const session = await createSessionForRefreshTest(database);

		vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 11));
		const expectedExpiresAt = Date.now() + DAY_IN_MS * 15;

		const refreshedSession = await refreshSession({
			database,
			session
		});
		const storedSession = await database.query.sessions.findFirst({
			where: { id: session.id }
		});

		expect(refreshedSession).not.toBeNull();
		expect(refreshedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
		expect(storedSession?.expiresAt.getTime()).toBe(expectedExpiresAt);
	});

	it('refreshSession - expires at exactly Date.now()', async () => {
		const database = createDatabase(':memory:');
		const session = await createSessionForRefreshTest(database);

		vi.setSystemTime(session.expiresAt);

		await expect(
			refreshSession({
				database,
				session
			})
		).resolves.toBeNull();
		await expect(
			database.query.sessions.findFirst({ where: { id: session.id } })
		).resolves.toBeUndefined();
	});

	it('refreshSession - deletes expired sessions', async () => {
		const database = createDatabase(':memory:');
		const session = await createSessionForRefreshTest(database);

		vi.setSystemTime(new Date(Date.now() + DAY_IN_MS * 21));

		await expect(
			refreshSession({
				database,
				session
			})
		).resolves.toBeNull();
		await expect(
			database.query.sessions.findFirst({ where: { id: session.id } })
		).resolves.toBeUndefined();
	});
}
