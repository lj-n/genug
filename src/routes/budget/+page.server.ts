import { withAuth } from '$lib/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(() => {
	const currentMonth = new Date().toISOString().substring(0, 7);
	throw redirect(302, `/budget/${currentMonth}`);
});
