import { beforeAll, describe, expect, test } from 'vitest';

import type { Database } from '../db';
import type { Auth } from '.';
import {
	createUser,
	createUserSession,
	deleteUser,
	getUserSettings,
	updateUserSettings
} from './user';
import { useTestDatabase } from '$testing/create.test.db';

let db: Database;
let auth: Auth;

beforeAll(() => {
	const test = useTestDatabase();
	db = test.database;
	auth = test.auth;
	return () => {
		test.client.close();
	};
});

describe('user', () => {
	const username = 'Testinguser';
	const password = 'password';

	test('create user', async () => {
		const { user, session } = await createUser(db, auth, username, password);

		expect(user.name).toBe(username);
		expect(session.fresh).toBe(true);

		await expect(
			/** Username already taken */
			() => createUser(db, auth, username, password)
		).rejects.toThrowError();
	});

	test('create user session', async () => {
		const session = await createUserSession(db, auth, username, password);
		expect(session).toBeDefined();

		await expect(
			/** Invalid key */
			() => createUserSession(db, auth, username, 'wrong password')
		).rejects.toThrowError();
	});

	test('invalidate user session', async () => {
		const session = await createUserSession(db, auth, username, password);
		await auth.invalidateUserSessions(session.userId);

		const invalidSession = await auth.validateSession(session.id);
		expect(invalidSession.session).toBeNull();
		expect(invalidSession.user).toBeNull();
	});

	test('get user profile', async () => {
		const session = await createUserSession(db, auth, username, password);

		const profile = getUserSettings(db, session.userId);

		expect(profile.userId).toBe(session.userId);

		expect(() => getUserSettings(db, 'wrong_user_id')).toThrowError(
			`User with id (wrong_user_id) not found.`
		);
	});

	test('update user profile', async () => {
		const session = await createUserSession(db, auth, username, password);
		const profile = updateUserSettings(db, session.userId, {
			theme: 'dark'
		});

		expect(profile.theme).toBe('dark');
		expect(() =>
			updateUserSettings(db, 'wrong_user_id', { theme: 'light' })
		).toThrowError('User with id (wrong_user_id) not found.');
	});

	test('delete user', async () => {
		const session = await createUserSession(db, auth, username, password);

		const id = deleteUser(db, session.userId);

		expect(id).toBe(session.userId);

		await expect(() =>
			createUserSession(db, auth, username, password)
		).rejects.toThrowError();

		expect(() => deleteUser(db, id)).toThrowError(
			`User with id (${id}) not found.`
		);
	});
});
