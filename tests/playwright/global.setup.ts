import { test as setup } from './fixture';

setup.describe('Setup', async () => {
	setup.describe.configure({ mode: 'serial' });

	setup('Reset Database', async ({ page, pages }) => {
		const response = await page.goto('/login/first');
		if (response?.status() === 404) {
			await pages.auth.login(...pages.auth.admin);
			await pages.admin.resetDatabase();
		}
	});

	setup('Create admin, signout & login again.', async ({ page, pages }) => {
		const admin = await pages.auth.createAdmin();
		await pages.auth.signout();
		await page.waitForURL('/login');
		await pages.auth.login(...admin);
	});
});
