import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class AccountPage extends BasePage {
	constructor(page: Page) {
		super(page);
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
