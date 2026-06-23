import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class CategoryPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async create(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		await this.page.getByRole('link', { name: currentName }).click();

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

		await expect(this.page.getByRole('link', { exact: true, name: newName })).toBeVisible();
	}
}
