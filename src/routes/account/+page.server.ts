import { withAuth } from '$lib/server';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async (_, user) => {
	return {
		accounts: user.account.getAll()
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
			const account = user.account.create({ name: accountName, description });

			return { success: true, account };
		} catch (_e) {
			return fail(500, {
				accountName,
				description,
				error: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
