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

	/**
	 * Reset a user's password via the row's ⋮ menu and return the new password
	 * revealed in the modal. Deliberately does NOT navigate — it runs on the
	 * current `/admin` visit so it can chain after an earlier reveal, the
	 * same-visit condition that regressed in #362.
	 */
	async resetPassword(username: string) {
		const row = this.page.getByRole('listitem').filter({ hasText: username });
		await row.getByRole('button', { name: 'User actions' }).click();
		await this.page.getByRole('menuitem', { name: 'Reset Password' }).click();

		const passwordLocator = this.page.getByLabel('Generated password', { exact: true });
		await expect(passwordLocator).toBeVisible();

		// Read before closing: the dialog unmounts on close (instantly under the
		// reduced-motion e2e context), so the locator is gone afterwards.
		const password = await passwordLocator.textContent();

		await this.page.getByRole('button', { name: 'Close' }).first().click();
		await expect(passwordLocator).toBeHidden();

		if (!password) throw new Error('Could not read reset password');

		return password;
	}
}
