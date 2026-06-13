import { test } from './fixture';

test('Create User', async ({ pages }) => {
	const _user = await pages.auth.createUserAndLogin();
});
