import { resolve } from '$app/paths';
import { actions } from '$db';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const isFirstUser = await actions.user.isFirstUser();
	if (isFirstUser) redirect(302, resolve('/login/first'));
	return { title: 'Login' };
};
