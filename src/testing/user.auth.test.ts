import { useUserAuth } from '$lib/server/user';
import { describe, expect, test } from 'vitest';

const userAuth = useUserAuth();

const username = 'Superman';
const password = 'cryptonite';
describe('user auth', () => {
	test('create user', async () => {
		const { user } = await userAuth.createUser(username, password);

		expect(user.name).toBe(username);
	});

	test('login user', async () => {
		const session = await userAuth.login(username, password);
		expect(session).toBeDefined();

		await expect(() => userAuth.login(username, '123')).rejects.toThrowError();
	});
});
