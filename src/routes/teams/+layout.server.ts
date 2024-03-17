import { protectRoute } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getTeams } from '$lib/server/teams';

export const load: LayoutServerLoad = protectRoute((_, user) => {
	return { teams: getTeams(db, user.id, true) };
});
