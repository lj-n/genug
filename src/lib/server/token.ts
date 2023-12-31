import { eq } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import { generateRandomString, isWithinExpiration } from 'lucia/utils';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

/**
 * Create a user token in the database.
 * Can be used for email verification, password reset, etc.
 * @returns Promise with the token id
 */
export async function generateToken(userId: string): Promise<string> {
	const existingToken = await db
		.select()
		.from(schema.token)
		.where(eq(schema.token.userId, userId))
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

	await db.insert(schema.token).values({
		id: newToken,
		userId,
		expires: new Date().getTime() + EXPIRES_IN
	});

	return newToken;
}

/**
 * Validate a user token.
 * @returns Promise with the user id
 */
export async function validateToken(tkn: string): Promise<string> {
	const foundToken = await db.transaction(async (tx) => {
		const [storedToken] = await tx
			.select()
			.from(schema.token)
			.where(eq(schema.token.id, tkn))
			.execute();

		if (!storedToken) {
			throw new Error('Token not found');
		}

		await tx
			.delete(schema.token)
			.where(eq(schema.token.userId, storedToken.userId))
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
 * @returns Promise with true if the token exists and is not expired, false otherwise.
 */
export async function isValidToken(tkn: string): Promise<boolean> {
	const [foundToken] = await db
		.select()
		.from(schema.token)
		.where(eq(schema.token.id, tkn))
		.execute();

	if (!foundToken) {
		return false;
	}

	return isWithinExpiration(foundToken.expires);
}
