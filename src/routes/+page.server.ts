import { protectRoute } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = protectRoute(() => {
	redirect(302, '/budget');
});
