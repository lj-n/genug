import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
	async changeDisplayName(name: string) {
		const input = this.page.getByRole('textbox', { name: 'Display Name' });
		await input.clear();
		await input.fill(name);
		await this.page.getByRole('button', { exact: true, name: 'Save' }).click();

		// Changing the name is invisible at the origin, so success is signaled
		// by an anchored toast. Dismiss via click to guard against occlusion.
		const savedToast = this.page.getByRole('status').filter({ hasText: 'Saved' });
		await expect(savedToast).toBeVisible();
		await savedToast.getByRole('button').click();
		await expect(savedToast).not.toBeVisible();

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

	async changePassword(currentPassword: string, newPassword: string) {
		await this.page.getByLabel('Current Password').fill(currentPassword);
		await this.page.getByLabel('New Password').fill(newPassword);
		await this.page.getByRole('button', { name: 'Save & Log Out' }).click();

		const toast = this.page.getByRole('status').filter({ hasText: 'Password changed.' });
		await expect(toast).toBeVisible();
		await toast.getByRole('button').click();
		await expect(toast).not.toBeVisible();
	}

	/** Issues a token and returns the one-time plaintext from the reveal dialog. */
	async createApiToken(name: string): Promise<string> {
		await this.page.getByRole('textbox', { name: 'Token Name' }).fill(name);
		await this.page.getByRole('button', { name: 'Create Token' }).click();

		const dialog = this.page.getByRole('dialog', { name: 'Token Created' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('img', { name: /QR code/ })).toBeVisible();
		const token = (await dialog.locator('[aria-label="api-token"]').textContent()) ?? '';
		expect(token.length).toBeGreaterThan(20);

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();
		return token;
	}

	async goto() {
		await this.page.goto('/settings');
		await expect(this.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	}

	async revokeApiToken(name: string) {
		const row = this.page.getByRole('listitem').filter({ hasText: name });
		await row.getByRole('button', { name: `Revoke ${name}` }).click();

		const dialog = this.page.getByRole('alertdialog', { name: 'Revoke Token' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { exact: true, name: 'Revoke' }).click();
		await expect(dialog).not.toBeVisible();
		await expect(row).not.toBeVisible();
	}

	async setTheme(label: 'Dark' | 'Light' | 'System') {
		// A single-type toggle group exposes its items as radios.
		await this.page.getByRole('radio', { exact: true, name: label }).click();
	}
}
