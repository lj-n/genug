import { withAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = withAuth(async (_, user) => {
	return {
		teams: user.team.all.map((team) => ({ id: team.id, name: team.name }))
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
			newTeam = user.team.create({ teamname: name, description });
		} catch (error) {
			return fail(500, {
				name,
				description,
				error: 'Something went wrong, please try again.'
			});
		}

		throw redirect(302, `/team/${newTeam.id}`);
	})
} satisfies Actions;
