import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	isNameAlreadyInUse,
	protectRoute,
	setUserAvatar,
	updateUserSettings
} from '$lib/server/auth';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

const IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png'];

export const load: PageServerLoad = protectRoute(async (_, user) => {
	return { user };
});

export const actions = {
	updateAvatar: protectRoute(async ({ request }, user) => {
		const length = +(request.headers.get('content-length') ?? '0');
		const MAX_SIZE = 1024 * 1024; // 1MB

		if (length > MAX_SIZE) {
			return fail(413, { error: 'Image is too large. Max size: 1MB' });
		}

		const formData = await request.formData();
		const image = formData.get('image');

		if (!(image instanceof File) || !IMAGE_TYPES.includes(image.type)) {
			return fail(400, {
				error: 'Please provide a valid image (.jpeg/.png/.gif).'
			});
		}

		try {
			setUserAvatar(db, user.id, {
				image: Buffer.from(await image.arrayBuffer()),
				imageType: image.type
			});
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	}),

	removeAvatar: protectRoute((_, user) => {
		try {
			setUserAvatar(db, user.id, null);
		} catch {
			return fail(500, { error: 'Oops, something went wrong.' });
		}

		return { success: true };
	}),

	changeTheme: protectRoute(async ({ request }, user) => {
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
			updateUserSettings(db, user.id, { theme });
		} catch (error) {
			return fail(500, { changeThemeError: 'Something went wrong.' });
		}
	}),

	changeUsername: protectRoute(async ({ request }, user) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();

		if (!username) {
			return fail(400, {
				changeUsernameError: 'Please provide a new username.'
			});
		}

		try {
			/** TODO: Create update function for this! */
			db.update(schema.user)
				.set({ name: username })
				.where(eq(schema.user.id, user.id))
				.returning()
				.get();
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

	changePassword: protectRoute(() => {
		return fail(501, { changePasswordError: 'Not implemented yet.' });
	})
} satisfies Actions;
