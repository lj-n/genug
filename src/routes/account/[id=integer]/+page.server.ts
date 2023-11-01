import { withAuth } from '$lib/server/auth';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

const getAccountWithLastTransactions = db.query.userAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.userId, sql.placeholder('userId')),
				eq(account.id, sql.placeholder('accountId'))
			);
		},
		with: {
			transactions: {
				orderBy: (transaction, { desc }) => [
					desc(transaction.date),
					desc(transaction.createdAt)
				],
				limit: sql.placeholder('limit'),
				with: { category: true }
			}
		}
	})
	.prepare();

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const account = getAccountWithLastTransactions.get({
		userId: user.id,
		accountId: Number(params.id),
		limit: 4
	});
	const balance = user.account.getBalance(Number(params.id));

	if (!account || !balance) {
		throw error(404, 'Account not found.');
	}

	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ icon: 'layers', title: 'Accounts', href: '/account' },
		{ title: account.name }
	];

	return { breadcrumbs, account, balance };
});

export const actions = {
	changeName: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();

		if (!accountName) {
			return fail(400, { errorNameUpdate: 'Please provide an account name.' });
		}

		try {
			user.account.update(Number(params.id), { name: accountName });
		} catch (error) {
			return fail(500, { errorNameUpdate: 'Something went wrong, oops.' });
		}
	})
} satisfies Actions;
