import { eq } from 'drizzle-orm';
import { db } from './db';
import { token } from './schema';
import { generateRandomString, isWithinExpiration } from 'lucia/utils';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

/**
 * Create a user token in the database.
 * Can be used for email verification, password reset, etc.
 * @returns The token id
 */
export async function generateToken(userId: string) {
	const existingToken = await db
		.select()
		.from(token)
		.where(eq(token.userId, userId))
		.execute();

	/** Check if a non expired (or soon to be expired) token already exists. */
	if (existingToken.length) {
		const foundToken = existingToken.find((tkn) =>
			isWithinExpiration(tkn.expires - EXPIRES_IN / 2)
		);

		if (foundToken) {
			return foundToken.id;
		}
	}

	const newToken = generateRandomString(63);

	await db.insert(token).values({
		id: newToken,
		userId,
		expires: new Date().getTime() + EXPIRES_IN
	});

	return newToken;
}

/**
 * Validate a user token.
 * @returns The user id
 */
export async function validateToken(tkn: string) {
	const foundToken = await db.transaction(async (tx) => {
		const [storedToken] = await tx
			.select()
			.from(token)
			.where(eq(token.id, tkn))
			.execute();

		if (!storedToken) {
			throw new Error('Token not found');
		}

		await tx
			.delete(token)
			.where(eq(token.userId, storedToken.userId))
			.execute();

		return storedToken;
	});

	if (!isWithinExpiration(foundToken.expires)) {
		throw new Error('Token expired');
	}

	return foundToken.userId;
}

/**
 * Check if a user token is valid.
 * This does not delete the token in the database.
 * @returns true if the token exists and is not expired, false otherwise.
 */
export async function isValidToken(tkn: string) {
	const [foundToken] = await db
		.select()
		.from(token)
		.where(eq(token.id, tkn))
		.execute();

	if (!foundToken) {
		return false;
	}

	return isWithinExpiration(foundToken.expires);
}
