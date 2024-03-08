import { protectRoute, setUserPassword } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq, not } from 'drizzle-orm';

export const load: PageServerLoad = protectRoute((_, user) => {
	if (!user.isAdmin) {
		redirect(302, '/');
	}

	const users = db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			isAdmin: schema.user.isAdmin
		})
		.from(schema.user)
		.where(not(eq(schema.user.id, user.id)))
		.all();

	return { users };
});

export const actions: Actions = {
	default: protectRoute(async ({ request }, user) => {
		if (!user.isAdmin) {
			return fail(403, {
				error: 'You are not authorized to perform this action.'
			});
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const password = formData.get('password')?.toString();

		if (!userId || !password) {
			return fail(400, {
				error: 'Please provide a user ID and password.'
			});
		}

		try {
			setUserPassword(db, userId, password);
		} catch (error) {
			return fail(500, { error: 'An error occurred while updating the user.' });
		}

		return { success: true };
	})
};
