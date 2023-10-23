import { db, withAuth } from '$lib/server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createInsertSchema } from 'drizzle-zod';
import { schema } from '$lib/server/schema';
import { z } from 'zod';
import { createUserTransaction } from '$lib/server/transactions';
import type { UserTransaction } from '$lib/server/schema/tables';

const getData = (userId: string) => {
	return db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, userId),
		with: {
			categories: true,
			accounts: true
		}
	});
};

export const load: PageServerLoad = withAuth(async (_, user) => {
	const data = await getData(user.userId);

	if (!data) {
		throw error(500, 'Could not fetch user data');
	}

	return {
		categories: data.categories,
		accounts: data.accounts
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

		let transaction: UserTransaction;

		try {
			transaction = createUserTransaction({
				userId: user.userId,
				...parsed.data
			});
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		throw redirect(302, `/transaction/${transaction.id}`);
	})
} satisfies Actions;
