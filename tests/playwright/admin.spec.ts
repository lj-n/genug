import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';

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

// #422: the fixture's `page.goto` waits for hydration, so a submit right after
// a full page load reaches the enhanced form. Before, it could land
// pre-hydration, post natively and never reveal the generated password (#416).
test('Create User right after a full page load reveals the generated password', async ({
	page,
	pages
}) => {
	await pages.auth.login(...pages.auth.admin);

	await page.goto('/admin');
	await page.getByLabel('Username').fill(faker.string.alphanumeric(8).toUpperCase());
	await page.getByRole('button', { name: 'Create User' }).click();

	await expect(page.getByLabel('Generated password', { exact: true })).toBeVisible();
});
