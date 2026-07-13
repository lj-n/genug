import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';

import { test } from './fixture';

test('Change Display Name', async ({ page, pages }) => {
	const [username] = await pages.auth.createUserAndLogin();
	await pages.settings.goto();

	await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue(username);

	const newName = faker.string.alphanumeric(10);
	await pages.settings.changeDisplayName(newName);
});

test('Change Password shows a success toast and logs out', async ({ page, pages }) => {
	const [username, password] = await pages.auth.createUserAndLogin();
	await pages.settings.goto();

	const newPassword = '5678user!$1234';
	await pages.settings.changePassword(password, newPassword);

	// The password change invalidates every session; the old one is gone.
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);

	await pages.auth.login(username, newPassword);
});

test('Change Language', async ({ pages }) => {
	await pages.auth.createUserAndLogin();
	await pages.settings.goto();
	await pages.settings.changeLanguage('de');
});

test('Change Theme applies instantly and persists across a reload', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();
	await pages.settings.goto();

	// Applied instantly on the current document (client toggles the class).
	await pages.settings.setTheme('Dark');
	await expect(page.locator('html')).toHaveClass(/dark/);

	// Persisted via the cookie: the server re-emits the class on a fresh load.
	await page.reload();
	await expect(page.locator('html')).toHaveClass(/dark/);

	// Back to System drops the override so prefers-color-scheme takes over.
	await pages.settings.setTheme('System');
	await expect(page.locator('html')).not.toHaveClass(/dark|light/);
});
