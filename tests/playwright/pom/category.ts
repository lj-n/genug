import { expect, type Locator } from '@playwright/test';

import { BasePage } from './base-page';

export class CategoryPage extends BasePage {
	/**
	 * From the detail page: archives the category, waits for the redirect to the
	 * archived-categories page, then returns to the budget table and asserts the
	 * row is gone.
	 */
	async archive(name: string) {
		await this.gotoDetailPage(name);

		await expect(this.page.getByRole('heading', { name: 'Archive Category' })).toBeVisible();
		await this.page.getByRole('button', { exact: true, name: 'Archive' }).click();

		// Archiving flips `archivedAt`, and the detail page redirects archived
		// categories to the archived list.
		await expect(this.page.getByRole('heading', { name: 'Archived Categories' })).toBeVisible();

		await this.#gotoBudgetTable();
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
		// A successful create navigates back to the budget page; the error keeps us
		// on the create page. Match the pathname only: this page is reached by a
		// direct goto (desktop creates via a dialog instead), so a submit fired
		// before the remote form has enhanced falls back to a native POST that
		// leaves the action query (`?/remote=.../createCategory`) on the URL. The
		// contract — "no navigation away from the create page" — holds either way,
		// and the strict `$` anchor made this assertion flaky on that fallback.
		await expect(this.page).toHaveURL(/\/categories\/new(\?|$)/);
	}

	/**
	 * From the detail page of an empty, unused category: deletes it through the
	 * confirm dialog and asserts the post-delete navigation lands on the budget
	 * table with the row gone (#147: this refresh used to be dropped).
	 */
	async delete(name: string) {
		await this.gotoDetailPage(name);

		await expect(this.page.getByRole('heading', { name: 'Delete Category' })).toBeVisible();
		await this.page.getByRole('button', { exact: true, name: 'Delete' }).click();

		const confirm = this.page.getByRole('alertdialog');
		await expect(
			confirm.getByRole('heading', { name: 'Delete category permanently?' })
		).toBeVisible();
		await confirm.getByRole('button', { exact: true, name: 'Delete' }).click();

		// Deleting navigates to the budget table at the current month.
		await expect(this.page).toHaveURL(/\/\d{6}$/);
		await expect(this.page.getByRole('row').filter({ hasText: name })).not.toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		await this.gotoDetailPage(currentName);

		const nameInput = this.page.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(newName);
		await this.page.getByRole('button', { exact: true, name: 'Save' }).click();

		// The "Saved" toast is anchored to the save button but rendered at body
		// level. Dismiss it via click: unlike toBeVisible(), a click fails when
		// other content paints over the toast, so this guards against occlusion.
		const savedToast = this.page.getByRole('status').filter({ hasText: 'Saved' });
		await expect(savedToast).toBeVisible();
		await savedToast.getByRole('button').click();
		await expect(savedToast).not.toBeVisible();

		// Saving stays on the page; the name-only title picks up the new name.
		await expect(this.page).toHaveURL(/\/categories\/[^/]+$/);
		await expect(this.page.getByRole('heading', { name: newName })).toBeVisible();

		await this.#gotoBudgetTable();
		await expect(
			this.page.getByRole('table').getByRole('button', { exact: true, name: newName })
		).toBeVisible();
	}

	/**
	 * Opens the detail page for `currentName` and renames it to `existingName`
	 * (another category in the same budget). Asserts the duplicate-name error
	 * surfaces as a field error and saving does not happen.
	 */
	async editNameExpectingError(currentName: string, existingName: string) {
		await this.gotoDetailPage(currentName);

		const nameInput = this.page.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(existingName);
		await this.page.getByRole('button', { exact: true, name: 'Save' }).click();

		await expect(this.page.getByText(`${existingName} already exists.`)).toBeVisible();
		// The error keeps us on the page and no "Saved" toast appears.
		await expect(this.page).toHaveURL(/\/categories\/[^/]+$/);
		await expect(this.page.getByRole('status').filter({ hasText: 'Saved' })).not.toBeVisible();
	}

	/**
	 * Opens the detail page for a category that still has a transaction and
	 * asserts the Delete button is disabled with the transaction-count reason.
	 */
	async expectDeleteDisabled(name: string) {
		await this.gotoDetailPage(name);

		await expect(this.page.getByRole('heading', { name: 'Delete Category' })).toBeVisible();
		await expect(this.page.getByRole('button', { exact: true, name: 'Delete' })).toBeDisabled();
		await expect(this.page.getByText(/transactions? still reference this category/)).toBeVisible();
	}

	/** From the budget month page: opens the archived list and follows the category link back. */
	async followArchivedCategoryLink(categoryName: string, budgetName: string) {
		await this.page.getByRole('link', { name: /archived/ }).click();
		await expect(this.page.getByRole('heading', { name: 'Archived Categories' })).toBeVisible();

		await this.page.getByRole('link', { exact: true, name: categoryName }).click();

		// The archived list links to the budget month page.
		await expect(this.page.getByRole('heading', { name: budgetName })).toBeVisible();
	}

	/**
	 * From the budget table: reaches the category detail page through the
	 * popover's Settings link.
	 */
	async gotoDetailPage(name: string) {
		await this.openPopover(name);
		await this.popover().getByRole('link', { name: 'Settings' }).click();

		await expect(this.page).toHaveURL(/\/categories\/[^/]+$/);
		await expect(this.page.getByRole('heading', { name })).toBeVisible();
	}

	/** Opens the anchored monthly-stats popover from the desktop name cell. */
	async openPopover(name: string) {
		const row = this.page.getByRole('row').filter({ hasText: name });
		await row.getByRole('button', { exact: true, name }).click();

		await expect(this.popover()).toBeVisible();
	}

	/** The monthly-stats popover anchored to the desktop name cell. */
	popover(): Locator {
		return this.page.locator('[data-slot="popover-content"]');
	}

	/** Returns to the budget month page captured at createBudget time. */
	async #gotoBudgetTable() {
		if (!this.ctx.budgetUrl || !this.ctx.budgetName) {
			throw new Error('createBudget must be called before navigating to the budget table');
		}
		await this.page.goto(this.ctx.budgetUrl);
		// The budget heading, not the table: archiving the last category leaves
		// the table's empty state instead of a rendered table.
		await expect(this.page.getByRole('heading', { name: this.ctx.budgetName })).toBeVisible();
	}
}
