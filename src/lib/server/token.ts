import { eq } from 'drizzle-orm';
import { db } from './db';
import { emailVerificationToken, passwordResetToken } from './schema';
import { generateRandomString, isWithinExpiration } from 'lucia/utils';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export async function generateEmailVerificationToken(userId: string) {
	const storedTokens = await db
		.select()
		.from(emailVerificationToken)
		.where(eq(emailVerificationToken.user_id, userId))
		.execute();

	if (storedTokens.length) {
		const foundToken = storedTokens.find((tkn) =>
			// check if expiration is within 1 hour
			isWithinExpiration(Number(tkn.expires) - EXPIRES_IN / 2)
		);

		if (foundToken) {
			return foundToken.id;
		}
	}

	const token = generateRandomString(63);

	await db
		.insert(emailVerificationToken)
		.values({
			id: token,
			user_id: userId,
			expires: new Date().getTime() + EXPIRES_IN
		})
		.execute();

	return token;
}

export async function validateEmailVerificationToken(token: string) {
	const foundToken = await db.transaction(async (tx) => {
		const [storedToken] = await tx
			.select()
			.from(emailVerificationToken)
			.where(eq(emailVerificationToken.id, token))
			.execute();

		if (!storedToken) {
			throw new Error('Token not found');
		}

		await tx
			.delete(emailVerificationToken)
			.where(eq(emailVerificationToken.user_id, storedToken.user_id))
			.execute();

		return storedToken;
	});

	// bigint -> number
	if (!isWithinExpiration(Number(foundToken.expires))) {
		throw new Error('Token expired');
	}

	return foundToken.user_id;
}

export async function generatePasswordResetToken(userId: string) {
	const storedTokens = await db
		.select()
		.from(passwordResetToken)
		.where(eq(passwordResetToken.user_id, userId))
		.execute();

	if (storedTokens.length) {
		const foundToken = storedTokens.find((token) => {
			return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
		});

		if (foundToken) {
			return foundToken.id;
		}
	}

	const token = generateRandomString(63);

	await db
		.insert(passwordResetToken)
		.values({
			id: token,
			user_id: userId,
			expires: new Date().getTime() + EXPIRES_IN
		})
		.execute();

	return token;
}

export async function validatePasswordResetToken(token: string) {
	const foundToken = await db.transaction(async (tx) => {
		const [storedToken] = await tx
			.select()
			.from(passwordResetToken)
			.where(eq(passwordResetToken.id, token))
			.execute();

		if (!storedToken) {
			throw new Error('Token not found');
		}

		await tx
			.delete(passwordResetToken)
			.where(eq(passwordResetToken.user_id, storedToken.user_id))
			.execute();

		return storedToken;
	});

	// bigint -> number
	if (!isWithinExpiration(Number(foundToken.expires))) {
		throw new Error('Token expired');
	}

	return foundToken.user_id;
}

export async function isValidPasswordResetToken(token: string) {
	const [foundToken] = await db
		.select()
		.from(passwordResetToken)
		.where(eq(passwordResetToken.id, token))
		.execute();

	if (!foundToken) {
		return false;
	}

	return isWithinExpiration(Number(foundToken.expires));
}
