import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth, isNameAlreadyInUse, withAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

const IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png'];

export const load: PageServerLoad = withAuth(async () => {
	return {};
});

export const actions = {
	updateAvatar: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const image = formData.get('image');

		if (!(image instanceof File) || !IMAGE_TYPES.includes(image.type)) {
			return fail(400, {
				error: 'Please provide a valid image (.jpeg/.png/.gif).'
			});
		}

		db.update(schema.userProfile)
			.set({
				image: Buffer.from(await image.arrayBuffer()),
				imageType: image.type
			})
			.where(eq(schema.userProfile.userId, user.id))
			.returning()
			.get();

		return { success: true };
	}),

	removeAvatar: withAuth((_, user) => {
		db.update(schema.userProfile)
			.set({
				image: null,
				imageType: null
			})
			.where(eq(schema.userProfile.userId, user.id))
			.returning()
			.get();

		return { success: true };
	}),

	changeTheme: withAuth(async ({ request }, user) => {
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
			db.update(schema.userProfile)
				.set({ theme })
				.where(eq(schema.userProfile.userId, user.id))
				.returning()
				.get();
		} catch (error) {
			return fail(500, { changeThemeError: 'Something went wrong.' });
		}
	}),

	changeUsername: withAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();

		if (!username) {
			return fail(400, {
				changeUsernameError: 'Please provide a new username.'
			});
		}

		try {
			await auth.updateUserAttributes(user.id, { name: username });
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

	changePassword: withAuth(async ({ request }) => {
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
