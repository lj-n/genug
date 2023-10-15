import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (!session) throw redirect(302, '/signin');
	if (!session.user.emailVerified) throw redirect(302, '/email-verification');

	return { user: session.user };
};
