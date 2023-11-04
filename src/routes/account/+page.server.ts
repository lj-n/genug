import { withAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(async (_, user) => {
	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ title: 'Accounts' }
	];

	return {
		breadcrumbs,
		accounts: user.account.getBalances()
	};
});

export const actions = {
	default: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Missing account name' });
		}

		try {
			const account = user.account.create({ name, description });
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
