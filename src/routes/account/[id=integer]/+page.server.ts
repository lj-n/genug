import { protectRoute } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import {
	getUserAccount,
	getUserAccountTransactionInfo,
	getUserAccounts,
	updateUserAccount
} from '$lib/server/account';

export const load: PageServerLoad = protectRoute(
	async ({ params }, { userId }) => {
		const account = getUserAccount(db, userId, Number(params.id));

		if (!account) {
			throw error(404, 'Account not found.');
		}

		const transactionInfo = getUserAccountTransactionInfo(
			db,
			userId,
			Number(params.id)
		);

		return {
			account,
			transactionInfo,
			otherAccounts: getUserAccounts(db, userId).filter(
				(acc) => acc.id !== Number(params.id)
			)
		};
	}
);

export const actions = {
	updateAccount: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		let name = formData.get('name')?.toString();
		let description = formData.get('description')?.toString();

		if (!name && !description) {
			return fail(400);
		}

		try {
			/** Prevent empty strings from being submitted */
			name ||= undefined;
			description ||= undefined;

			updateUserAccount(db, userId, Number(params.id), { name, description });
		} catch (_e) {
			return fail(500, {
				updateAccountError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();
		const newAccountId = formData.get('newAccountId')?.toString();

		const account = getUserAccount(db, userId, Number(params.id));

		if (!account || account.name !== accountName) {
			return fail(400, {
				newAccountId,
				accountName,
				moveTransactionError: 'The account name does not match.'
			});
		}

		if (!newAccountId) {
			return fail(400, {
				accountName,
				moveTransactionError: 'No new account selected.'
			});
		}

		try {
			db.update(schema.userTransaction)
				.set({
					accountId: Number(newAccountId)
				})
				.where(
					and(
						eq(schema.userTransaction.userId, userId),
						eq(schema.userTransaction.accountId, account.id)
					)
				)
				.returning()
				.all();
		} catch (error) {
			fail(500, { moveTransactionError: 'Something went wrong, sorry.' });
		}
	}),

	removeAccount: protectRoute(async ({ params, request }, { userId }) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();

		const account = getUserAccount(db, userId, Number(params.id));

		if (!account || account.name !== accountName) {
			return fail(400, {
				accountName,
				removeAccountError: 'Wrong account name.'
			});
		}

		try {
			db.transaction(() => {
				db.delete(schema.userTransaction)
					.where(
						and(
							eq(schema.userTransaction.userId, userId),
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
