import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class CategoryPage extends BasePage {
	async archive(name: string) {
		await this.openDetail(name);

		const dialog = this.page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Archive Category' })).toBeVisible();
		await dialog.getByRole('button', { exact: true, name: 'Archive' }).click();

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();

		// The archived category leaves the budget table.
		await expect(this.page.getByRole('row').filter({ hasText: name })).not.toBeVisible();
	}

	async create(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('button', { exact: true, name })).toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		await this.openDetail(currentName);

		const dialog = this.page.getByRole('dialog');
		const nameInput = dialog.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(newName);
		await dialog.getByRole('button', { exact: true, name: 'Save' }).click();

		await expect(dialog.getByText('Saved')).toBeVisible();
		// Saving must not close the dialog.
		await expect(dialog).toBeVisible();

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();

		await expect(
			this.page.getByRole('table').getByRole('button', { exact: true, name: newName })
		).toBeVisible();
	}

	/** From the budget month page: opens the archived list and follows the category link back. */
	async followArchivedCategoryLink(categoryName: string, budgetName: string) {
		await this.page.getByRole('link', { name: /archived/ }).click();
		await expect(this.page.getByRole('heading', { name: 'Archived Categories' })).toBeVisible();

		await this.page.getByRole('link', { exact: true, name: categoryName }).click();

		// The archived list links to the budget month page.
		await expect(this.page.getByRole('heading', { name: budgetName })).toBeVisible();
	}

	/** Opens the category detail dialog from the budget table row. */
	async openDetail(name: string) {
		const row = this.page.getByRole('row').filter({ hasText: name });
		await row.getByRole('button', { exact: true, name }).click();

		await expect(this.page.getByRole('dialog')).toBeVisible();
	}
}
