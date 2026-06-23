import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class BudgetPage extends BasePage {
	constructor(page: Page) {
		super(page);
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
			await expect(this.page.getByRole('link', { name })).toBeVisible();
		} else {
			await this.openMobileNavigation();
			await expect(this.page.getByRole('link', { name })).toBeVisible();
			await this.closeMobileNavigation();
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
			await expect(this.page.getByRole('link', { name })).toBeVisible();
		} else {
			await this.openMobileNavigation();
			await expect(this.page.getByRole('link', { name })).toBeVisible();
			await this.closeMobileNavigation();
		}
	}

	async createCategory(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
	}

	async goto(budgetName: string) {
		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}

		await this.page.getByRole('link', { name: budgetName }).click();
		await expect(this.page.getByRole('heading', { name: budgetName })).toBeVisible();
	}
}
