import { user } from '$db';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const isFirst = await user.isFirstUser();
	if (!isFirst) error(404);
	return { title: 'Willkommen' };
};
