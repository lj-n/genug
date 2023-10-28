import { User } from '$lib/server/user';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';
import { SqliteError } from 'better-sqlite3';

function isNameAlreadyInUse(e: unknown) {
	return (
		(e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
		(e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID')
	);
}

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!password || !username) {
			return fail(400, { error: 'Missing stuff..' });
		}

		try {
			const { session } = await User.create(username, password);
			locals.auth.setSession(session);
		} catch (error) {
			if (isNameAlreadyInUse(error)) {
				return fail(400, {
					username,
					password,
					error: 'Username is already in use'
				});
			}

			return fail(500, { username, error: 'Something went wrong, oops.' });
		}

		throw redirect(302, '/');
	}
} satisfies Actions;
