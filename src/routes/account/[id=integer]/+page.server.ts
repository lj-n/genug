import { withAuth } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	const account = user.account.getDetails(Number(params.id));

	if (!account) {
		throw error(404, 'Account not found.');
	}

  const allAccounts = user.account.getAll()
  const otherAccounts = allAccounts.filter(({ id }) => id !== Number(params.id) )

	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ title: 'Accounts', href: '/account' },
		{ title: account.details.name }
	];

	return {
		breadcrumbs,
		account,
    otherAccounts
	};
});

export const actions = {
	updateAccount: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name || !description) {
			return fail(400);
		}
		try {
			user.account.update(Number(params.id), { name, description });
		} catch (_e) {
			return fail(500, {
				updateAccountError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();
		const newAccountId = formData.get('newAccountId')?.toString();

		const account = user.account.get(Number(params.id));

		if (!account || account.name !== accountName) {
			return fail(400, {
				newAccountId,
				accountName,
				moveTransactionError: 'Wrong account name.'
			});
		}

		try {
			db.update(schema.userTransaction)
				.set({
					accountId: Number(newAccountId)
				})
				.where(
					and(
						eq(schema.userTransaction.userId, user.id),
						eq(schema.userTransaction.accountId, account.id)
					)
				)
				.returning()
				.all();
		} catch (error) {
			fail(500, { moveTransactionError: 'Something went wrong, sorry.' });
		}
	}),

	removeAccount: withAuth(async ({ params, request }, user) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();

		const account = user.account.get(Number(params.id));

		if (!account || account.name !== accountName) {
			return fail(400, {
				accountName,
				moveTransactionError: 'Wrong account name.'
			});
		}

		try {
			db.transaction(() => {
				db.delete(schema.userTransaction)
					.where(
						and(
							eq(schema.userTransaction.userId, user.id),
							eq(schema.userTransaction.accountId, account.id)
						)
					)
					.returning()
					.all();

				db.delete(schema.userAccount)
					.where(eq(schema.userAccount.id, account.id))
					.returning()
					.get();
			});
		} catch (error) {
			fail(500, { removeAccountError: 'Something went wrong, sorry.' });
		}

		throw redirect(302, '/account');
	})
} satisfies Actions;
