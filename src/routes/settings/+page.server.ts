import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	auth,
	isNameAlreadyInUse,
	protectRoute,
	setUserAvatar,
	updateUserSettings
} from '$lib/server/auth';
import { db } from '$lib/server/db';

const IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png'];

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return { user };
});

export const actions = {
	updateAvatar: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const image = formData.get('image');

		if (!(image instanceof File) || !IMAGE_TYPES.includes(image.type)) {
			return fail(400, {
				error: 'Please provide a valid image (.jpeg/.png/.gif).'
			});
		}

		try {
			setUserAvatar(db, userId, {
				image: Buffer.from(await image.arrayBuffer()),
				imageType: image.type
			});
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	}),

	removeAvatar: protectRoute((_, { userId }) => {
		try {
			setUserAvatar(db, userId, null);
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	}),

	changeTheme: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const theme = formData.get('theme')?.toString();

		if (!theme) {
			return fail(400, {
				changeThemeError: 'Please provide a new theme.'
			});
		}

		try {
			if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
				throw new Error('invalid theme');
			}
			updateUserSettings(db, userId, { theme });
		} catch (error) {
			return fail(500, { changeThemeError: 'Something went wrong.' });
		}
	}),

	changeUsername: protectRoute(async ({ request }, { userId }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();

		if (!username) {
			return fail(400, {
				changeUsernameError: 'Please provide a new username.'
			});
		}

		try {
			await auth.updateUserAttributes(userId, { name: username });
		} catch (error) {
			if (isNameAlreadyInUse(error)) {
				return fail(403, {
					username,
					changeUsernameError: 'Username is already in use.'
				});
			}
			return fail(500, {
				username,
				changeUsernameError: 'Something went wrong, oops.'
			});
		}
	}),

	changePassword: protectRoute(async ({ request }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString();

		if (!password) {
			return fail(400, {
				changePasswordError: 'Please provide a new username.'
			});
		}

		try {
			//
		} catch (error) {
			return fail(500, {
				changePasswordError: 'Something went wrong, please try again.'
			});
		}
	})
} satisfies Actions;
