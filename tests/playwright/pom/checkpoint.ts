import { expect, type Locator } from '@playwright/test';

import { BasePage } from './base-page';

export class CheckpointPage extends BasePage {
	/** The Adjustment amount at the bottom of the sum ("—" while the bank input is empty). */
	adjustment(): Locator {
		return this.page.getByTestId('checkpoint-adjustment');
	}

	/** The link back to the account, above the page title. */
	backLink(accountName: string): Locator {
		return this.page
			.locator('header')
			.filter({ has: this.page.getByRole('heading', { exact: true, name: 'Checkpoint' }) })
			.getByRole('link', { name: accountName });
	}

	/** The "Your bank" money input. */
	bankInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Your bank' });
	}

	/**
	 * Deletes the latest Checkpoint through its confirmation dialog and
	 * returns the dialog's description as shown before confirming.
	 */
	async deleteLatest(): Promise<string> {
		const before = await this.historyEntries().count();
		await this.history().getByRole('button', { name: 'Delete' }).click();
		const dialog = this.page.getByRole('alertdialog', { name: 'Delete this checkpoint?' });
		await expect(dialog).toBeVisible();
		const description = (await dialog.getByText('The checkpoint from').textContent()) ?? '';
		await dialog.getByRole('button', { name: 'Delete' }).click();
		await expect(dialog).toBeHidden();
		await expect(this.historyEntries()).toHaveCount(before - 1);
		return description.trim();
	}

	/** Enters the bank balance; a blur commits the formatted amount. */
	async enterBankBalance(amount: string) {
		await this.bankInput().fill(amount);
		await this.bankInput().blur();
	}

	/** The "Previous checkpoints" timeline. */
	history(): Locator {
		return this.page.locator('#history');
	}

	/** Timeline entries, newest first. */
	historyEntries(): Locator {
		return this.history().getByRole('listitem');
	}

	/** From an account page: follows the stamp button to the account's Checkpoint page. */
	async open() {
		await this.page.getByRole('link', { exact: true, name: 'Checkpoint' }).click();
		await expect(this.page.getByRole('heading', { exact: true, name: 'Checkpoint' })).toBeVisible();
	}

	setButton(): Locator {
		return this.page.getByRole('button', { name: 'Set checkpoint' });
	}

	/** Sets the checkpoint and waits for the inline confirmation; the input clears. */
	async submit() {
		await this.setButton().click();
		await expect(
			this.page.getByRole('status').filter({ hasText: 'Checkpoint set.' })
		).toBeVisible();
		await expect(this.bankInput()).toHaveValue('');
	}
}
