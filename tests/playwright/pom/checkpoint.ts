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
			.filter({ has: this.page.getByRole('heading', { name: 'Checkpoint' }) })
			.getByRole('link', { name: accountName });
	}

	/** The "Your bank" money input. */
	bankInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Your bank' });
	}

	/** Enters the bank balance; a blur commits the formatted amount. */
	async enterBankBalance(amount: string) {
		await this.bankInput().fill(amount);
		await this.bankInput().blur();
	}

	/** From an account page: follows the stamp button to the account's Checkpoint page. */
	async open() {
		await this.stampButton().click();
		await expect(this.page.getByRole('heading', { name: 'Checkpoint' })).toBeVisible();
	}

	setButton(): Locator {
		return this.page.getByRole('button', { name: 'Set checkpoint' });
	}

	/** The stamp button on an account page, named "Checkpoint suggested" while one is suggested. */
	stampButton(): Locator {
		return this.page.getByRole('link', { name: /^Checkpoint( suggested)?$/ });
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
