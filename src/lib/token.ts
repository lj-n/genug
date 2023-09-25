import { eq } from 'drizzle-orm';
import { db } from './db';
import { emailVerificationToken } from './schema';
import { generateRandomString, isWithinExpiration } from 'lucia/utils';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
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
};

export const validateEmailVerificationToken = async (token: string) => {
	const foundToken = await db.transaction(async (tx) => {
		console.log(await tx.select().from(emailVerificationToken).execute());

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
};
