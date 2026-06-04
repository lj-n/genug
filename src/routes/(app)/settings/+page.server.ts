import { m } from '$lib/paraglide/messages';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { title: m.settings_title() };
};
