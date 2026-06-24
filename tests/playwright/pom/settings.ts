import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async changeDisplayName(name: string) {
		const input = this.page.getByRole('textbox', { name: 'Display Name' });
		await input.clear();
		await input.fill(name);
		await this.page.getByRole('button', { exact: true, name: 'Save' }).click();
		await expect(input).toHaveValue(name);
	}

	async changeLanguage(locale: string) {
		const trigger = this.page.getByRole('button', { name: 'Available Languages' });
		await trigger.click();
		await this.page.getByRole('option', { name: locale }).click();
		await expect(trigger).toHaveText(locale);
	}

	async goto() {
		await this.page.goto('/settings');
		await expect(this.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	}
}
