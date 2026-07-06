import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
	async changeDisplayName(name: string) {
		const input = this.page.getByRole('textbox', { name: 'Display Name' });
		await input.clear();
		await input.fill(name);
		await this.page.getByRole('button', { exact: true, name: 'Save' }).click();
		await expect(input).toHaveValue(name);
	}

	async changeLanguage(locale: string) {
		await this.page.getByRole('button', { name: 'Available Languages' }).click();
		// The Select renders options in a floating portal. Wait for the
		// listbox to appear before looking for the option — on chromium,
		// floating-ui can take a frame or two to position the portal.
		await expect(this.page.getByRole('listbox')).toBeVisible();
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
