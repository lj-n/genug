import { expect } from '@playwright/test';

import { test } from './fixture';

test('Create User', async ({ pages }) => {
	const _user = await pages.auth.createUserAndLogin();
});

test('Delete User', async ({ pages }) => {
	await pages.auth.login(...pages.auth.admin);
	const [username] = await pages.auth.createUser();
	await pages.admin.deleteUser(username);
});

// #362: after an earlier reveal (user creation) the old code masked the reset
// behind the create result, so the modal never reopened and the user was
// locked out. Each reset must reopen it with its own distinct new password.
test('Reset Password reopens the modal after an earlier reveal', async ({ pages }) => {
	await pages.auth.login(...pages.auth.admin);
	const [username, createdPassword] = await pages.auth.createUser();

	const firstReset = await pages.admin.resetPassword(username);
	expect(firstReset).not.toBe(createdPassword);

	const secondReset = await pages.admin.resetPassword(username);
	expect(secondReset).not.toBe(firstReset);

	await pages.auth.signout();
	await pages.auth.login(username, secondReset);
});
