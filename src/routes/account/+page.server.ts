import { withAuth } from '$lib/server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createUserAccount, getUserAccounts } from '$lib/server/accounts';

export const load: PageServerLoad = withAuth(async (_, user) => {
	return {
		accounts: getUserAccounts(user.userId)
	};
});

export const actions = {
	createUserAccount: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();
		const description = formData.get('description')?.toString();

		if (!accountName) {
			return fail(400, { description, error: 'Missing account name' });
		}

		try {
			await createUserAccount(user.userId, accountName, description);
		} catch (_e) {
			return fail(500, {
				accountName,
				description,
				error: 'Something went wrong, please try again.'
			});
		}

		return { createSuccess: true };
	})
} satisfies Actions;
