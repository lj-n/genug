import { withAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async (_, user) => {
	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ icon: 'layers', title: 'Accounts' }
	];

	return {
		breadcrumbs,
		accounts: user.account.getBalances()
	};
});

export const actions = {
	createAccount: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const accountName = formData.get('accountName')?.toString();
		const accountDescription = formData.get('accountDescription')?.toString();

		if (!accountName) {
			return fail(400, { accountDescription, error: 'Missing account name' });
		}

		try {
			const account = user.account.create({
				name: accountName,
				description: accountDescription
			});

			return { success: true, account };
		} catch (_e) {
			return fail(500, {
				accountName,
				accountDescription,
				error: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
