import { formatCurrency } from '$lib/utils/format-currency';
import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

type CreateTransactionParams = {
	amount?: string;
	category?: string;
	date?: string;
	notes?: string;
	validated?: boolean;
};

export class AccountPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async createTransaction(params: CreateTransactionParams | string = {}) {
		const { amount, category, date, notes, validated } =
			typeof params === 'string' ? { amount: params } : params;

		await this.page.getByRole('button', { name: 'New Transaction' }).click();

		const createRow = this.page.getByRole('row', { name: 'New Transaction' });

		if (category !== undefined) {
			const categoryCombobox = createRow.getByRole('combobox').first();
			await categoryCombobox.click();
			await categoryCombobox.fill(category);
			await categoryCombobox.press('Enter');
		}

		if (notes !== undefined) {
			await createRow.getByRole('textbox', { name: 'Notes' }).fill(notes);
		}

		if (date !== undefined) {
			const dateButton = createRow.getByRole('combobox').nth(1);
			await dateButton.click();

			const day = String(new Date(date).getDate());
			await this.page.getByRole('button', { exact: true, name: day }).click();
		}

		if (amount !== undefined) {
			await createRow.getByRole('textbox', { name: 'Amount' }).fill(amount);
		}

		if (validated !== undefined) {
			const checkbox = createRow.getByRole('checkbox', { name: 'Validated' });
			const isChecked = await checkbox.isChecked();
			if (validated !== isChecked) {
				await checkbox.locator('xpath=..').click();
			}
		}

		await createRow.getByRole('button', { exact: true, name: 'Save' }).click();

		if (amount !== undefined) {
			await expect(
				this.page.getByRole('button', {
					exact: true,
					name: 'Edit amount'
				})
			).toHaveText(formatCurrency({ centValue: Number(amount) * 100, currency: 'EUR' }));
		}
	}

	async editName(name: string) {
		await this.page.getByRole('button', { name: 'Account Settings' }).click();
		await expect(this.page.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Account Name' }).clear();
		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);

		await this.page.getByRole('button', { name: 'Save Changes' }).click();

		await expect(this.page.getByRole('heading', { name })).toBeVisible();
	}

	async goto(accountName: string) {
		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}

		await this.page.getByRole('link', { name: accountName }).click();
		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
	}
}
