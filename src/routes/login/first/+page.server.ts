import { isFirstUser } from '$db';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const first = await isFirstUser();
	if (!first) error(404);
	return { title: 'Willkommen' };
};
