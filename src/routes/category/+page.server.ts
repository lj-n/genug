import { withAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(() => {
	const breadcrumbs: App.Breadcrumb[] = [
		{ icon: 'home', title: 'Home', href: '/' },
		{ title: 'Categories' }
	];

	return { breadcrumbs };
});

export const actions = {
	default: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		let description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Please provide a name.' });
		}

		try {
			description ||= undefined;
			const category = user.category.create({
				name,
				description
			});

			return { success: true, category };
		} catch (_e) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, sorry.'
			});
		}
	})
} satisfies Actions;
