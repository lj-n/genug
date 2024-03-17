import { protectRoute } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getAccount, updateAccount } from '$lib/server/accounts';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { getTeamRole } from '$lib/server/teams';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = protectRoute(async ({ parent, params }) => {
	const { accounts } = await parent();
	const account = accounts.find((acc) => acc.id === Number(params.id));

	if (!account) error(404, 'Account not found.');

	return {
		account,
		otherAccounts: accounts.filter((acc) => acc.id !== Number(params.id))
	};
});

export const actions = {
	updateAccount: protectRoute(async ({ params, request }, user) => {
		const formData = await request.formData();

		const parsed = zfd
			.formData({
				name: zfd.text(z.string().optional()),
				description: zfd.text(z.string().optional())
			})
			.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				data: Object.fromEntries(formData),
				error: 'Invalid Params'
			});
		}

		try {
			updateAccount(db, user.id, Number(params.id), parsed.data);
		} catch (_e) {
			return fail(500, {
				updateAccountError: 'Something went wrong, please try again.'
			});
		}
	}),

	moveTransactions: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();

		const account = getAccount(db, user.id, Number(params.id));

		if (!account) {
			return fail(401, { moveTransactionError: 'Account not found' });
		}

		const requestSchema = zfd.formData({
			newAccountId: zfd.numeric(z.number().int().positive()),
			accountName: zfd.text(z.literal(account.name))
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { moveTransactionError: 'Invalid Params' });
		}

		const newAccount = getAccount(db, user.id, parsed.data.newAccountId);

		if (!newAccount) {
			return fail(401, { moveTransactionError: 'New account not found' });
		}

		if (
			(account.teamId !== null || newAccount.teamId !== null) &&
			account.teamId !== newAccount.teamId
		) {
			return fail(401, {
				moveTransactionError: 'New account must belong to the same team'
			});
		}

		if (newAccount.teamId) {
			const role = getTeamRole(db, newAccount.teamId, user.id);
			if (role !== 'OWNER') {
				return fail(401, {
					moveTransactionError: 'Must be team owner'
				});
			}
		}

		try {
			db.update(schema.transaction)
				.set({ accountId: newAccount.id })
				.where(eq(schema.transaction.accountId, account.id))
				.run();
		} catch (error) {
			return fail(500, { moveTransactionError: 'Something went wrong' });
		}
	}),

	removeAccount: protectRoute(async ({ request, params }, user) => {
		const formData = await request.formData();

		const account = getAccount(db, user.id, Number(params.id));

		if (!account) {
			return fail(401, { removeAccountError: 'Account not found' });
		}

		const requestSchema = zfd.formData({
			accountName: zfd.text(z.literal(account.name))
		});

		const parsed = requestSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { removeAccountError: 'Invalid Params' });
		}

		if (account.teamId) {
			const role = getTeamRole(db, account.teamId, user.id);
			if (role !== 'OWNER') {
				return fail(401, {
					removeAccountError: 'Must be team owner'
				});
			}
		}

		try {
			db.transaction(() => {
				db.delete(schema.transaction)
					.where(eq(schema.transaction.accountId, account.id))
					.run();

				db.delete(schema.account)
					.where(eq(schema.account.id, account.id))
					.run();
			});
		} catch (error) {
			return fail(500, { removeAccountError: 'Not implemented' });
		}

		redirect(302, '/accounts');
	})
} satisfies Actions;
