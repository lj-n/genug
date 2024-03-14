import { getTeamRole, protectRoute } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import { getAccount, updateAccount } from '$lib/server/accounts';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

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

	moveTransactions: protectRoute(() => {
		return fail(500, { error: 'Not implemented' });
	}),

	removeAccount: protectRoute(() => {
		return fail(500, { error: 'Not implemented' });
	})
} satisfies Actions;
