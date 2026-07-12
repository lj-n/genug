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

	/**
	 * On the standalone create page (`/{budgetId}/categories/new`), submits a
	 * name that already exists in the budget. Asserts the duplicate-name error
	 * renders as a field error below the input and no navigation occurs.
	 */
	async createExpectingError(name: string) {
		if (!this.ctx.budgetId) {
			throw new Error('createBudget must be called before createExpectingError');
		}
		await this.page.goto(`/${this.ctx.budgetId}/categories/new`);
		await expect(this.page.getByRole('heading', { name: 'Add a new category' })).toBeVisible();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByText(`${name} already exists.`)).toBeVisible();
		// A successful create navigates back to the budget page; the error keeps us here.
		await expect(this.page).toHaveURL(/\/categories\/new$/);
	}

	/**
	 * Opens the detail dialog for an empty, unused category, deletes it through
	 * the confirm dialog, and asserts it disappears from the budget table.
	 */
	async delete(name: string) {
		await this.openDetail(name);

		const dialog = this.page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Delete Category' })).toBeVisible();
		await dialog.getByRole('button', { exact: true, name: 'Delete' }).click();

		const confirm = this.page.getByRole('alertdialog');
		await expect(
			confirm.getByRole('heading', { name: 'Delete category permanently?' })
		).toBeVisible();
		await confirm.getByRole('button', { exact: true, name: 'Delete' }).click();

		// Deleting closes the detail dialog and drops the category from the table.
		await expect(dialog).not.toBeVisible();
		await expect(this.page.getByRole('row').filter({ hasText: name })).not.toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		await this.openDetail(currentName);

		const dialog = this.page.getByRole('dialog');
		const nameInput = dialog.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(newName);
		await dialog.getByRole('button', { exact: true, name: 'Save' }).click();

		// The "Saved" toast is anchored to the save button but rendered at body level.
		await expect(this.page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
		// Saving must not close the dialog.
		await expect(dialog).toBeVisible();

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();

		await expect(
			this.page.getByRole('table').getByRole('button', { exact: true, name: newName })
		).toBeVisible();
	}

	/**
	 * Opens the edit dialog for `currentName` and renames it to `existingName`
	 * (another category in the same budget). Asserts the duplicate-name error
	 * surfaces within the dialog and saving does not happen.
	 */
	async editNameExpectingError(currentName: string, existingName: string) {
		await this.openDetail(currentName);

		const dialog = this.page.getByRole('dialog');
		const nameInput = dialog.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(existingName);
		await dialog.getByRole('button', { exact: true, name: 'Save' }).click();

		await expect(dialog.getByText(`${existingName} already exists.`)).toBeVisible();
		// The error keeps the dialog open and no "Saved" toast appears.
		await expect(dialog).toBeVisible();
		await expect(this.page.getByRole('status').filter({ hasText: 'Saved' })).not.toBeVisible();
	}

	/**
	 * Opens the detail dialog for a category that still has a transaction and
	 * asserts the Delete button is disabled with the transaction-count reason.
	 */
	async expectDeleteDisabled(name: string) {
		await this.openDetail(name);

		const dialog = this.page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Delete Category' })).toBeVisible();
		await expect(dialog.getByRole('button', { exact: true, name: 'Delete' })).toBeDisabled();
		await expect(dialog.getByText(/transactions? still reference this category/)).toBeVisible();
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
