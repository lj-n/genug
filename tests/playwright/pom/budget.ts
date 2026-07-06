import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class BudgetPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async assignAmount(categoryName: string, amount: string) {
		const categoryRow = this.page.getByRole('row').filter({ hasText: categoryName });
		await categoryRow.getByRole('button', { name: 'Budget' }).click();
		await this.page.getByRole('textbox', { name: 'Budget' }).fill(amount);
		await this.page.getByRole('textbox', { name: 'Budget' }).press('Enter');

		// Wait for form submission to complete and popover to close
		await expect(this.page.getByRole('textbox', { name: 'Budget' })).not.toBeVisible();
		await expect(categoryRow.getByRole('button', { name: 'Budget' })).toBeVisible();
	}

	async createAccount(name: string, startingBalance = '0') {
		await this.page.getByRole('button', { name: 'Show Accounts' }).click();
		await expect(this.page.getByRole('menuitem', { name: 'Add Account' })).toBeVisible();

		await this.page.getByRole('menuitem', { name: 'Add Account' }).click();
		await expect(this.page.getByRole('heading', { name: 'Add New Account' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Account Name' }).clear();
		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);

		await this.page.getByRole('textbox', { name: 'What is the current balance?' }).clear();
		await this.page
			.getByRole('textbox', { name: 'What is the current balance?' })
			.fill(startingBalance);

		await this.page.getByRole('button', { name: 'Create Account' }).click();

		if (this.isDesktop) {
			await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
		} else {
			await this.openMobileNavigation();
			await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
		}
	}

	async createBudget(name: string) {
		await this.page.goto('/new');
		await expect(
			this.page.getByRole('heading', { name: 'Create Your First Budget Plan' })
		).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Budget Name' }).fill(name);

		await this.page.getByRole('button', { name: 'Create Budget' }).click();

		if (this.isDesktop) {
			await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
		} else {
			await this.openMobileNavigation();
			await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
		}
	}

	async createCategory(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
		// The budget table reloads from a separate data fetch than the sidebar.
		// Wait for the new category's Budget button to appear in the table row
		// — this is what assignAmount needs to interact with next.
		await expect(
			this.page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Budget' })
		).toBeVisible();
	}

	async goto(budgetName: string) {
		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}

		await this.page.getByRole('link', { exact: true, name: budgetName }).click();
		await this.page.waitForLoadState('networkidle');
		await expect(this.page.getByRole('heading', { name: budgetName })).toBeVisible();
	}

	async transferToCategory(sourceCategoryName: string, amount: string, targetCategoryName: string) {
		const categoryRow = this.page.getByRole('row').filter({ hasText: sourceCategoryName });
		const remainingCell = categoryRow.getByRole('cell').nth(3);
		await remainingCell.getByRole('button').click();

		await expect(this.page.getByText('Move')).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Amount' }).fill(amount);
		await this.page.getByRole('button', { name: 'Select category' }).click();
		await this.page.getByRole('option', { name: targetCategoryName }).click();

		await this.page.getByRole('button', { name: 'OK' }).click();

		await expect(this.page.getByText('Move')).not.toBeVisible();
	}

	async transferToUnassigned(categoryName: string, amount: string) {
		const categoryRow = this.page.getByRole('row').filter({ hasText: categoryName });
		const remainingCell = categoryRow.getByRole('cell').nth(3);
		await remainingCell.getByRole('button').click();

		await expect(this.page.getByText('Move')).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Amount' }).fill(amount);
		await this.page.getByRole('button', { name: 'Select category' }).click();
		await this.page.getByRole('option', { name: 'Unassigned' }).click();

		// Workaround: after selecting "Unassigned" in the Combobox, headless
		// Chromium does not close the dropdown consistently. The balance badge
		// (which appears in the popover after assigning to the source category)
		// then overlays the OK button. Clicking the amount input steals focus,
		// which dismisses the Combobox dropdown and reflows the layout.
		await this.page.getByRole('textbox', { name: 'Amount' }).click();
		await this.page.getByRole('button', { name: 'OK' }).click();

		await expect(this.page.getByText('Move')).not.toBeVisible();
	}
}
