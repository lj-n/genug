import {
	auth,
	db,
	generateToken,
	isValidEmailAddress,
	schema,
	sendPasswordResetLink
} from '$lib/server';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		// basic check
		if (!email || !isValidEmailAddress(email)) {
			return fail(400, { message: 'Invalid email' });
		}
		try {
			// check if user exists
			const [foundUser] = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.email, email))
				.execute();

			if (!foundUser) {
				return fail(400, { message: 'User not found' });
			}
			const user = auth.transformDatabaseUser(foundUser);
			const token = await generateToken(foundUser.id);

			await sendPasswordResetLink(user, token);

			return { success: true };
		} catch (error) {
			console.log('🛸 < file: +page.server.ts:17 < error =', error);
			return fail(500, { message: 'An unknown error occurred' });
		}
	}
} satisfies Actions;
