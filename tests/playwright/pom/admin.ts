import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class AdminPage extends BasePage {
	async deleteUser(username: string) {
		await this.page.goto('/admin');

		const row = this.page.getByRole('listitem').filter({ hasText: username });
		await row.getByRole('button', { name: 'Remove User' }).click();

		// The delete is confirmed through the app's own alert dialog.
		const dialog = this.page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Delete' }).click();

		await expect(dialog).toBeHidden();
		await expect(row).toHaveCount(0);
	}

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
