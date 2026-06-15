import { resolve } from '$app/paths';
import { isFirstUser } from '$db';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const first = await isFirstUser();
	if (first) redirect(302, resolve('/login/first'));
	return { title: 'Login' };
};
