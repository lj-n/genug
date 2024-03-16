import { protectRoute } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMonthInFormat } from '$lib/components/date.utils';

export const load: PageServerLoad = protectRoute(() => {
	const currentMonth = getMonthInFormat(new Date());
	redirect(302, `/budget/${currentMonth}`);
});
