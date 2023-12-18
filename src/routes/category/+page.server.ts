import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { protectRoute } from '$lib/server/auth';
import { createUserCategory, getUserCategories } from '$lib/server/category';
import { db } from '$lib/server/db';

export const load: PageServerLoad = protectRoute(async (_, { userId }) => {
	return { categories: getUserCategories(db, userId) };
});

export const actions = {
	default: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		let description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Please provide a name.' });
		}

		try {
			description ||= undefined;

			const category = createUserCategory(db, {
				userId,
				name,
				description
			});

			return { success: true, category };
		} catch (_e) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, sorry.'
			});
		}
	})
} satisfies Actions;
