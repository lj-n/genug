import { asMoney, formatMoney } from '$lib/utils/money';
import { expect } from '@playwright/test';

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
	/**
	 * Opens the account settings dialog and archives the account. An empty
	 * account is archivable, so archiving navigates to the archived-accounts
	 * list where the account appears with a restore action.
	 */
	async archive(accountName: string) {
		await this.page.getByRole('button', { name: 'Account Settings' }).click();

		const dialog = this.page.getByRole('dialog');
		await dialog.getByRole('button', { name: 'Archive' }).click();

		// Archiving takes the account off its detail page and lands on the archive.
		await expect(this.page.getByRole('heading', { name: 'Archived Accounts' })).toBeVisible();
		await expect(this.page.getByRole('link', { name: accountName })).toBeVisible();
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
					hasText: formatMoney({
						currency: 'EUR',
						money: asMoney(Math.round(Number(amount) * 100))
					})
				})
			).toBeVisible();
		}

		if (validated === true) {
			await expect(this.page.locator('[role="row"] svg.text-success').first()).toBeVisible();
		}
	}

	async deleteTransaction() {
		const row = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('cell', { name: 'Edit category' }) })
			.first();
		const cellCount = await this.page.getByRole('cell', { name: 'Edit category' }).count();
		await row.getByRole('cell', { name: 'Edit category' }).click();

		const editForm = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('button', { name: 'Save' }) });
		await editForm.getByRole('button', { name: 'Delete' }).click();

		// The refreshed list drops the deleted transaction, which unmounts the
		// edit row. Asserting the edit form is gone distinguishes a real delete
		// from merely being in edit mode (where the category cell also vanishes).
		await expect(editForm).not.toBeVisible();
		await expect(this.page.getByRole('cell', { name: 'Edit category' })).toHaveCount(cellCount - 1);
	}

	async editName(name: string) {
		await this.page.getByRole('button', { name: 'Account Settings' }).click();
		await expect(this.page.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Account Name' }).clear();
		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);

		await this.page.getByRole('button', { name: 'Save Changes' }).click();

		await expect(this.page.getByRole('heading', { name })).toBeVisible();
	}

	/**
	 * Opens the account settings dialog and renames the account to `existingName`
	 * (another account in the same budget). Asserts the duplicate-name error
	 * surfaces as a field error within the dialog.
	 */
	async editNameExpectingError(existingName: string) {
		await this.page.getByRole('button', { name: 'Account Settings' }).click();

		const dialog = this.page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		const nameInput = dialog.getByRole('textbox', { name: 'Account Name' });
		await nameInput.clear();
		await nameInput.fill(existingName);
		await dialog.getByRole('button', { name: 'Save Changes' }).click();

		await expect(dialog.getByText(`${existingName} already exists.`)).toBeVisible();
		// The error keeps the dialog open.
		await expect(dialog).toBeVisible();
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

		// Verify edited values are reflected in the read-only row
		const readOnlyRow = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('cell', { name: 'Edit category' }) })
			.first();

		if (params.notes !== undefined) {
			await expect(
				readOnlyRow.getByRole('cell', { name: 'Edit notes' }).filter({ hasText: params.notes })
			).toBeVisible();
		}

		if (params.amount !== undefined) {
			await expect(
				readOnlyRow.getByRole('cell', { name: 'Edit amount' }).filter({
					hasText: formatMoney({
						currency: 'EUR',
						money: asMoney(Math.round(Number(params.amount) * 100))
					})
				})
			).toBeVisible();
		}

		if (params.validated === true) {
			await expect(readOnlyRow.locator('svg.text-success').first()).toBeVisible();
		}
	}

	async goto(accountName: string) {
		const url = this.ctx.accounts.get(accountName);
		if (!url) {
			throw new Error(`Account "${accountName}" must be created before goto`);
		}
		await this.page.goto(url);
		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
	}

	/**
	 * On the archived-accounts page, restores the named account. Restoring
	 * navigates back to the account's detail page.
	 */
	/**
	 * From the archived-accounts list, opens the named account and asserts its
	 * detail page is read-only: the archived notice replaces the register, and
	 * there is no way to add transactions or reach the settings dialog.
	 */
	async openArchivedAccountAndVerifyReadOnly(accountName: string) {
		await this.page.getByRole('link', { name: accountName }).click();

		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
		await expect(this.page.getByText('This account is archived')).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'New Transaction' })).toHaveCount(0);
		await expect(this.page.getByRole('button', { name: 'Account Settings' })).toHaveCount(0);
	}

	/**
	 * Restores an account from the archived notice on its own detail page. The
	 * active register (with the New Transaction button) returns in place.
	 */
	async restoreFromDetail() {
		await this.page.getByRole('button', { name: 'Restore' }).click();

		await expect(this.page.getByRole('button', { name: 'New Transaction' })).toBeVisible();
	}

	async toggleValidated() {
		const row = this.page
			.getByRole('row')
			.filter({ has: this.page.getByRole('button', { name: 'Toggle validated status' }) })
			.first();

		// Capture current state before toggling
		const hadCheckIcon = (await row.locator('svg.text-success').count()) > 0;

		await row.getByRole('button', { name: 'Toggle validated status' }).click();

		// The button wraps a form submit; the icon assertion below retries until
		// the toggle is reflected.
		if (hadCheckIcon) {
			await expect(row.locator('svg.text-success')).toHaveCount(0);
		} else {
			await expect(row.locator('svg.text-success').first()).toBeVisible();
		}
	}
}
