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

type EditTransactionParams = {
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
			await createRow.getByRole('button', { name: 'Open category dropdown' }).click();
			await this.page.getByRole('option', { name: category }).click();
		}

		if (notes !== undefined) {
			await createRow.getByRole('textbox', { name: 'Notes' }).fill(notes);
		}

		if (date !== undefined) {
			const dateButton = createRow.getByRole('combobox', { name: 'Select date' });
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
				await checkbox.click();
			}
		}

		await createRow.getByRole('button', { exact: true, name: 'Save' }).click();

		await expect(createRow).not.toBeVisible();

		if (category !== undefined) {
			await expect(
				this.page.getByRole('button', { name: 'Edit category' }).filter({ hasText: category })
			).toBeVisible();
		}

		if (notes !== undefined) {
			await expect(
				this.page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: notes })
			).toBeVisible();
		}

		if (date !== undefined) {
			const day = String(new Date(date).getDate()).padStart(2, '0');
			await expect(
				this.page.getByRole('button', { name: 'Edit date' }).filter({ hasText: day })
			).toBeVisible();
		}

		if (amount !== undefined) {
			await expect(
				this.page.getByRole('button', { name: 'Edit amount' }).filter({
					hasText: formatCurrency({ centValue: Number(amount) * 100, currency: 'EUR' })
				})
			).toBeVisible();
		}

		if (validated === true) {
			await expect(
				this.page.locator('[role="row"] svg.text-success').first()
			).toBeVisible();
		}
	}

	async editTransaction(params: EditTransactionParams) {
		// Click first editable row to enter edit mode
		const row = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('cell', { name: 'Edit category' }) })
			.first();
		await row.getByRole('cell', { name: 'Edit category' }).click();

		const editForm = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('button', { name: 'Save' }) });

		if (params.category !== undefined) {
			await editForm.getByRole('button', { name: 'Open category dropdown' }).click();
			await this.page.getByRole('option', { name: params.category }).click();
		}

		if (params.notes !== undefined) {
			await editForm.getByRole('textbox', { name: 'Notes' }).fill(params.notes);
		}

		if (params.date !== undefined) {
			const dateButton = editForm.getByRole('combobox', { name: 'Select date' });
			await dateButton.click();
			const day = String(new Date(params.date).getDate());
			await this.page.getByRole('button', { exact: true, name: day }).click();
		}

		if (params.amount !== undefined) {
			await editForm.getByRole('textbox', { name: 'Amount' }).fill(params.amount);
		}

		if (params.validated !== undefined) {
			const checkbox = editForm.getByRole('checkbox', { name: 'Validated' });
			const isChecked = await checkbox.isChecked();
			if (params.validated !== isChecked) {
				await checkbox.click();
			}
		}

		await editForm.getByRole('button', { name: 'Save' }).click();
		await expect(editForm).not.toBeVisible();
	}

	async deleteTransaction() {
		const row = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('cell', { name: 'Edit category' }) })
			.first();
		const rowText = await row.textContent();
		await row.getByRole('cell', { name: 'Edit category' }).click();

		const editForm = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('button', { name: 'Save' }) });
		await editForm.getByRole('button', { name: 'Delete' }).click();

		// Verify row is gone
		if (rowText) {
			await expect(this.page.getByText(rowText.substring(0, 20))).not.toBeVisible();
		}
	}

	async toggleValidated() {
		const row = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('button', { name: 'Toggle validated status' }) })
			.first();
		await row.getByRole('button', { name: 'Toggle validated status' }).click();
		await this.page.waitForLoadState('networkidle');
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
