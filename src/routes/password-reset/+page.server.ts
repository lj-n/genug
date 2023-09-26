import {
	auth,
	db,
	generatePasswordResetToken,
	sendPasswordResetLink,
	isValidEmail,
	user as userSchema
} from '$lib/server';
import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		// basic check
		if (!isValidEmail(email)) {
			return fail(400, {
				message: 'Invalid email'
			});
		}
		try {
			const [storedUser] = await db
				.select()
				.from(userSchema)
				.where(eq(userSchema.email, email))
				.execute();

			if (!storedUser) {
				return fail(400, {
					message: 'User does not exist'
				});
			}

			const user = auth.transformDatabaseUser(storedUser);
			
			const token = await generatePasswordResetToken(user.userId);

			await sendPasswordResetLink(token);

			return {
				success: true
			};
		} catch (e) {
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
	}
};
