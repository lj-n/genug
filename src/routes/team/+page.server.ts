import {
	acceptTeamInvitation,
	cancelTeamInvitation,
	createTeam,
	protectRoute
} from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = protectRoute(() => {});

export const actions: Actions = {
	create: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();

		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();

		if (!name) {
			return fail(400, { description, error: 'Name is required' });
		}

		try {
			createTeam(db, user.id, name, description);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	accept: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const teamId = formData.get('teamId')?.toString();

		if (!teamId) {
			return fail(400, { error: 'Team ID is required' });
		}

		try {
			acceptTeamInvitation(db, Number(teamId), user.id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}),

	decline: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const teamId = formData.get('teamId')?.toString();

		if (!teamId) {
			return fail(400, { error: 'Team ID is required' });
		}

		try {
			cancelTeamInvitation(db, Number(teamId), user.id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	})
};
