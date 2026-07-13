import { m } from '$lib/paraglide/messages';
import { parseTheme, THEME_COOKIE_NAME } from '$lib/utils/theme';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	return { theme: parseTheme(cookies.get(THEME_COOKIE_NAME)), title: m.settings_title() };
};
