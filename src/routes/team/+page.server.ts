import { withAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createTeam } from '$lib/server/team';

export const load: PageServerLoad = withAuth(async (_, user) => {
	return {
		teams: user.team.getAll()
	};
});

export const actions = {
	createTeam: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Missing team name' });
		}

		let newTeam;

		try {
			newTeam = createTeam({ teamname: name, description, userId: user.id });
		} catch (error) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, please try again.'
			});
		}

		redirect(302, `/team/${newTeam.id}`);
	})
} satisfies Actions;
