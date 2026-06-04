import { resolve } from '$app/paths';
import { m } from '$lib/paraglide/messages';
import { error, redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) redirect(307, resolve('/login'));
	if (!locals.session.user.isAdmin) error(404);
	return { title: m.admin_settings_title() };
};
