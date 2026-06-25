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
		await this.page.getByRole('button', { name: 'Available Languages' }).click();
		await this.page.getByRole('option', { name: locale }).click();
		// Language change may navigate; the trigger's aria-label also changes languages.
		// Match by regex that covers both English and German labels, check text is locale code.
		await expect(
			this.page.getByRole('button', {
				name: /Available Languages|Verfügbare Sprachen/
			})
		).toContainText(locale);
	}

	async goto() {
		await this.page.goto('/settings');
		await expect(this.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	}
}
