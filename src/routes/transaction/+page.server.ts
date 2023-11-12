import { withAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { schema } from '$lib/server/schema';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = withAuth(({ url }, user) => {
	const { searchParams } = url;

	const limit = Number(searchParams.get('limit')) || 20;
	const offset = Number(searchParams.get('offset')) || 0;
	const page = Number(searchParams.get('page')) || 1;

	const transactions = db.query.userTransaction.findMany({
		where: (transaction, { eq }) => eq(transaction.userId, user.id),
		orderBy: (transaction, { asc, desc }) => [
			asc(transaction.validated),
			desc(transaction.date),
			desc(transaction.createdAt)
		],
		limit,
		offset: (page - 1) * limit,
		with: {
			account: true,
			category: true
		}
	});

	return {
		limit,
		offset,
		page,
		transactions,
		accounts: user.account.getAll(),
		categories: user.category.getAll()
	};
});

export const actions = {
	create: withAuth(async ({ request }, user) => {
		const formData = Object.fromEntries((await request.formData()).entries());
		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				...formData,
				createError: 'Please provide valid values.'
			});
		}

		try {
			const transaction = user.transaction.create(parsed.data);
			return { success: true, transaction };
		} catch (er) {
			console.log('🛸 < file: +page.server.ts:53 < er =', er);
			return fail(500, { createError: 'Oops, something went wrong.' });
		}
	}),

	validate: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const transactionId = formData.get('id')?.toString();
		const validated = formData.get('validated')?.toString();

		if (!transactionId) {
			return fail(400, { validateError: 'Missing transaction id.' });
		}

		try {
			const transaction = user.transaction.update(Number(transactionId), {
				validated: validated === 'true'
			});

			return { success: true, transaction };
		} catch {
			return fail(500, { validateError: 'Oops, something went wrong.' });
		}
	}),

	remove: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const transactionId = formData.get('id')?.toString();

		if (!transactionId) {
			return fail(400, { removeError: 'Missing transaction id.' });
		}

		try {
			const transaction = user.transaction.remove(Number(transactionId));
			return { success: true, transaction };
		} catch {
			return fail(500, { removeError: 'Oops, something went wrong.' });
		}
	})
} satisfies Actions;

const requestSchema = createInsertSchema(schema.userTransaction, {
	accountId: z.coerce.number().int(),
	categoryId: z.coerce
		.number()
		.int()
		.transform((c) => c || null),
	date: z.coerce.date().transform((dt) => dt.toISOString().slice(0, 10)),
	flow: z.coerce.number().int(),
	validated: z.coerce.boolean()
}).omit({ userId: true, id: true, createdAt: true });
