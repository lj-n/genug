import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class CategoryPage extends BasePage {
	async create(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		// Target the category link inside the budget table row, which is
		// always visible in the page content (unlike the nav drawer link
		// which shares the same accessible name on tablet).
		const row = this.page.getByRole('row').filter({ hasText: currentName });
		await row.getByRole('link', { exact: true, name: currentName }).click();

		const dialog = this.page.getByRole('dialog');
		await expect(dialog).toBeVisible();

		const nameInput = dialog.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(newName);
		await nameInput.blur();

		await expect(dialog.getByText('Saved')).toBeVisible();

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();

		await expect(
			this.page.getByRole('table').getByRole('link', { exact: true, name: newName })
		).toBeVisible();
	}
}
