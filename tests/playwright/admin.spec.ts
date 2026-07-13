import { test } from './fixture';

test('Create User', async ({ pages }) => {
	const _user = await pages.auth.createUserAndLogin();
});

test('Delete User', async ({ pages }) => {
	await pages.auth.login(...pages.auth.admin);
	const [username] = await pages.auth.createUser();
	await pages.admin.deleteUser(username);
});
