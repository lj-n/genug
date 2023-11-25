import { beforeAll, describe, expect, test } from 'vitest';

import type { Database } from '../db';
import type { Auth } from '../auth';
import {
	createUser,
	createUserSession,
	deleteUser,
	getUserProfile,
	updateUserProfile
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
		expect(session.state).toBe('active');

		await expect(
			/** Username already taken */
			() => createUser(db, auth, username, password)
		).rejects.toThrowError();
	});

	test('create user session with key', async () => {
		const session = await createUserSession(auth, username, password);
		expect(session).toBeDefined();

		await expect(
			/** Invalid key */
			() => createUserSession(auth, username, 'wrong password')
		).rejects.toThrowError();
	});

	test('invalidate user session', async () => {
		const session = await createUserSession(auth, username, password);
		await auth.invalidateAllUserSessions(session.user.userId);

		await expect(() =>
			auth.getSession(session.sessionId)
		).rejects.toThrowError();
		await expect(() =>
			auth.validateSession(session.sessionId)
		).rejects.toThrowError();
	});

	test('get user profile', async () => {
		const session = await createUserSession(auth, username, password);

		const profile = getUserProfile(db, session.user.userId);

		expect(profile.userId).toBe(session.user.userId);

		expect(() => getUserProfile(db, 'wrong_user_id')).toThrowError(
			`User with id (wrong_user_id) not found.`
		);
	});

	test('update user profile', async () => {
		const session = await createUserSession(auth, username, password);
		const profile = updateUserProfile(db, session.user.userId, {
			theme: 'dark'
		});

		expect(profile.theme).toBe('dark');
		expect(() =>
			updateUserProfile(db, 'wrong_user_id', { theme: 'light' })
		).toThrowError('User with id (wrong_user_id) not found.');
	});

	test('delete user', async () => {
		const session = await createUserSession(auth, username, password);

		const id = deleteUser(db, session.user.userId);

		expect(id).toBe(session.user.userId);

		await expect(() =>
			createUserSession(auth, username, password)
		).rejects.toThrowError();

		expect(() => deleteUser(db, id)).toThrowError(
			`User with id (${id}) not found.`
		);
	});
});
