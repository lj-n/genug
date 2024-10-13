import { protectRoute } from '$lib/server/auth';
import { getCategories, updateCategory } from '$lib/server/categories';
import { db } from '$lib/server/db';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from '@sveltejs/kit';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

const formschema = z.object({
	categoryId: z.coerce.number().int()
});

export const load: PageServerLoad = protectRoute(async (_, user) => {
	const categories = getCategories(db, user.id, true).filter(
		(category) => category.retired
	);
	return {
		categories,
		form: await superValidate(zod(formschema))
	};
});

export const actions = {
	unretire: protectRoute(async ({ request, cookies }, user) => {
		const form = await superValidate(request, zod(formschema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { categoryId } = form.data;

		let category;
		try {
			category = updateCategory(db, user.id, categoryId, { retired: false });
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}

		const url = new URL(cookies.get('shallowRoute') ?? '/categories');

		if (category.teamId) {
			url.searchParams.set('selectedTeam', category.teamId.toString());
		}

		redirect(302, url);
	}),

	remove: protectRoute(async ({ request, cookies }, user) => {
		const form = await superValidate(request, zod(formschema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { categoryId } = form.data;

		try {
			// Todo: check if user has permission to delete team category
			db.delete(schema.category)
				.where(
					and(
						eq(schema.category.id, categoryId),
						eq(schema.category.userId, user.id)
					)
				)
				.execute();
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}

		const url = new URL(cookies.get('shallowRoute') ?? '/categories');

		redirect(302, url);
	})
} satisfies Actions;
