import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class AdminPage extends BasePage {
	async resetDatabase() {
		await this.page.goto('/admin');
		await this.page.getByRole('button', { name: 'Reset Instance' }).click();

		// The reset is confirmed through the app's own alert dialog (no native confirm).
		const dialog = this.page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Reset Instance' }).click();

		await this.page.waitForURL('/login/first');
	}
}
