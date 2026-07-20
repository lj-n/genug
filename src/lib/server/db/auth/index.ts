import type { Cookies } from '@sveltejs/kit';

import { database, type Database, tables } from '$db';
import { hashOptions } from '$server/utils/hash-options';
import { hash, verify } from '@node-rs/argon2';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64 } from '@oslojs/encoding';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';

import {
	DAY_IN_MS,
	InvalidCredentialsError,
	isExpired,
	type Session,
	SESSION_COOKIE_NAME,
	shouldRefresh
} from './utils';

export async function authenticateUser({
	db = database,
	password,
	username
}: {
	db?: Database;
	password: string;
	username: string;
}) {
	const user = await db.query.users.findFirst({ where: { username } });
	if (!user) throw new InvalidCredentialsError();

	const { passwordHash, ...userWithoutPassword } = user;

	const validPassword = await verify(passwordHash, password);
	if (!validPassword) throw new InvalidCredentialsError();

	return userWithoutPassword;
}

export function createSession({ db = database, userId }: { db?: Database; userId: string }) {
	const sessionToken = createSessionToken();
	const tokenBuffer = new TextEncoder().encode(sessionToken);
	const sessionId = encodeHexLowerCase(sha256(tokenBuffer));
	const session = db.insert(tables.sessions).values({ id: sessionId, userId }).returning().get();
	return { session, sessionToken };
}

export function createSessionToken(): string {
	const randomBytes = crypto.getRandomValues(new Uint8Array(12));
	return encodeBase64(randomBytes);
}

export function deleteSession({ db = database, sessionId }: { db?: Database; sessionId: string }) {
	db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId)).run();
}

export function deleteSessionCookie({ cookies }: { cookies: Cookies }): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export function deleteUserSessions({ db = database, userId }: { db?: Database; userId: string }) {
	db.delete(tables.sessions).where(eq(tables.sessions.userId, userId)).run();
}

export function getSessionCookie({ cookies }: { cookies: Cookies }) {
	return cookies.get(SESSION_COOKIE_NAME);
}

export async function hashPassword({ password }: { password: string }): Promise<string> {
	return hash(password, hashOptions);
}

export function refreshSession({ db = database, session }: { db?: Database; session: Session }) {
	if (isExpired(session.expiresAt)) {
		deleteSession({ db, sessionId: session.id });
		return null;
	}

	if (shouldRefresh(session.expiresAt)) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 15);
		db.update(tables.sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(tables.sessions.id, session.id))
			.run();
	}

	return session;
}

export function setSessionCookie({
	cookies,
	expiresAt,
	sessionToken
}: {
	cookies: Cookies;
	expiresAt?: Date;
	sessionToken: string;
}): void {
	cookies.set(SESSION_COOKIE_NAME, sessionToken, {
		expires: expiresAt,
		path: '/'
	});
}

export async function validateSession({
	db = database,
	sessionToken
}: {
	db?: Database;
	sessionToken: string;
}): Promise<null | Session> {
	const tokenBuffer = new TextEncoder().encode(sessionToken);
	const sessionId = encodeHexLowerCase(sha256(tokenBuffer));

	const session = await db.query.sessions.findFirst({
		columns: { userId: false },
		where: { id: sessionId },
		with: { user: { columns: { passwordHash: false } } }
	});

	if (!session || !session.user) {
		return null;
	}

	return refreshSession({ db, session });
}
