import { formatCurrency } from '$lib/utils/format-currency';
import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class AccountPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async createTransaction(amount: string) {
		await this.page.getByRole('button', { name: 'New Transaction' }).click();

		const createRow = this.page.getByRole('row', { name: 'New Transaction' });
		await createRow.getByRole('textbox', { name: 'Amount' }).fill(amount);
		await createRow.getByRole('button', { exact: true, name: 'Save' }).press('Enter');

		await expect(
			this.page.getByRole('button', {
				exact: true,
				name: 'Edit amount'
			})
		).toHaveText(formatCurrency({ centValue: Number(amount) * 100, currency: 'EUR' }));
	}

	async editName(name: string) {
		await this.page.getByRole('button', { name: 'Account Settings' }).click();
		await expect(this.page.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Account Name' }).clear();
		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);

		await this.page.getByRole('button', { name: 'Save Changes' }).click();

		await expect(this.page.getByRole('heading', { name })).toBeVisible();
	}

	async goto(accountName: string) {
		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}

		await this.page.getByRole('link', { name: accountName }).click();
		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
	}
}
