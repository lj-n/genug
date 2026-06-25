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

test('Change Language', async ({ pages }) => {
	await pages.auth.createUserAndLogin();
	await pages.settings.goto();
	await pages.settings.changeLanguage('de');
});
