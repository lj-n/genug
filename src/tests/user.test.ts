import { describe, expect, test, beforeAll } from 'vitest';
import { setupDataBase, teardownDataBase } from './setup';
import { createUser, loginUser } from '$lib/server/user';

beforeAll(() => {
	setupDataBase();
	return () => {
		teardownDataBase();
	};
});

const testUser = {
	name: 'Test User',
	email: 'test@user.com',
	password: 'userpassword'
};

describe('user', () => {
	test('create a user', async () => {
		const user = await createUser(
			testUser.email,
			testUser.name,
			testUser.password,
			true
		);

		expect(user).toBeDefined();
	});

	test('use user key to create session', async () => {
		const session = await loginUser(testUser.email, testUser.password);

		expect(session).toBeDefined();
	});
});
