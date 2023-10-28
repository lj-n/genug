import { withAuth } from '$lib/server';
import { fail, redirect } from '@sveltejs/kit';
import { createInsertSchema } from 'drizzle-zod';
import { schema } from '$lib/server/schema';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async (_, user) => {
	return {
		categories: user.category.getAll(),
		accounts: user.account.getAll()
	};
});

const requestSchema = createInsertSchema(schema.userTransaction, {
	accountId: z.coerce.number().int(),
	categoryId: z.coerce.number().int(),
	date: z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10)),
	flow: z.coerce.number().int(),
	validated: z.coerce.boolean()
}).omit({ userId: true, id: true, createdAt: true });

export const actions = {
	createUserTransaction: withAuth(async ({ request }, user) => {
		const formData = Object.fromEntries((await request.formData()).entries());
		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				...formData,
				error: 'Please provide correct values.'
			});
		}

		try {
			user.transaction.create(parsed.data);
			// return { success: true, transaction }
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		// throw redirect(302, `/transaction/${transaction.id}`);
		throw redirect(302, '/transaction');
	})
} satisfies Actions;
