import { database, type Database, tables } from '$db';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64, encodeHexLowerCase } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';

import { isExpired, type User } from './utils';

export function createApiToken({
	db = database,
	expiresAt,
	name,
	userId
}: {
	db?: Database;
	expiresAt?: Date;
	name: string;
	userId: string;
}) {
	const token = createApiTokenSecret();
	const apiToken = db
		.insert(tables.apiTokens)
		.values({ expiresAt, name, tokenHash: hashApiToken(token), userId })
		.returning()
		.get();
	return { apiToken, token };
}

export function createApiTokenSecret(): string {
	const randomBytes = crypto.getRandomValues(new Uint8Array(32));
	return encodeBase64(randomBytes);
}

export function deleteApiToken({
	db = database,
	tokenId,
	userId
}: {
	db?: Database;
	tokenId: string;
	userId: string;
}) {
	db.delete(tables.apiTokens)
		.where(and(eq(tables.apiTokens.id, tokenId), eq(tables.apiTokens.userId, userId)))
		.run();
}

export function listApiTokens({ db = database, userId }: { db?: Database; userId: string }) {
	return db.query.apiTokens.findMany({
		columns: { tokenHash: false },
		orderBy: { createdAt: 'desc' },
		where: { userId }
	});
}

export async function validateApiToken({
	db = database,
	token
}: {
	db?: Database;
	token: string;
}): Promise<null | User> {
	const apiToken = await db.query.apiTokens.findFirst({
		where: { tokenHash: hashApiToken(token) },
		with: { user: { columns: { passwordHash: false } } }
	});

	if (!apiToken || !apiToken.user) return null;

	if (apiToken.expiresAt && isExpired(apiToken.expiresAt)) {
		db.delete(tables.apiTokens).where(eq(tables.apiTokens.id, apiToken.id)).run();
		return null;
	}

	db.update(tables.apiTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(tables.apiTokens.id, apiToken.id))
		.run();

	return apiToken.user;
}

function hashApiToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}
