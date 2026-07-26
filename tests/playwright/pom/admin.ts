import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class AdminPage extends BasePage {
	async deleteUser(username: string) {
		await this.page.goto('/admin');

		const row = this.page.getByRole('listitem').filter({ hasText: username });
		// Row actions live behind a ⋮ overflow menu now (#279).
		await row.getByRole('button', { name: 'User actions' }).click();
		await this.page.getByRole('menuitem', { name: 'Delete' }).click();

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
