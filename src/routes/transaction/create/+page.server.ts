import { db, withAuth } from '$lib/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const getData = (userId: string) => {
	return db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, userId),
		with: {
			categories: true,
			accounts: true
		}
	});
};

export const load: PageServerLoad = withAuth(async (_, user) => {
	const data = await getData(user.userId);

	if (!data) {
		throw error(500, 'Could not fetch user data');
	}

	return {
		categories: data.categories,
		accounts: data.accounts
	};
});
