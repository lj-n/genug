import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { protectRoute } from '$lib/server/auth/utils';
import {
	createUserAccount,
	getUserAccountsWithBalance
} from '$lib/server/account';

export const load: PageServerLoad = protectRoute(async (_, { userId }) => {
	return {
		accounts: getUserAccountsWithBalance(db, userId)
	};
});

export const actions = {
	default: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, name, error: 'Missing account name' });
		}

		try {
			const account = createUserAccount(db, { userId, name, description });
			return { success: true, account };
		} catch (_e) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
