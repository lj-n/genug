import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { withAuth } from '$lib/server/auth';
import { useTeamAuth } from '$lib/server/team';

export const load: PageServerLoad = withAuth(async ({ params }, user) => {
	try {
		const team = user.team.get(Number(params.id));

		const { getRole, getMembers } = useTeamAuth(team.id, user.id);

		return { userId: user.id, members: getMembers(), role: getRole(), ...team };
	} catch (_e) {
		throw error(404, 'Team not found');
	}
});

export const actions = {} satisfies Actions;
