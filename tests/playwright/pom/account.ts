import { asMoney, formatMoney } from '$lib/utils/money';
import { expect, type Locator } from '@playwright/test';

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
	 * Adds a notes filter through the filter dropdown. The input debounces
	 * before the list refreshes; callers assert on the resulting list state.
	 */
	async applyNotesFilter(text: string) {
		await this.page.getByRole('button', { name: 'Filter' }).click();
		await this.page.getByRole('menuitem', { name: 'Notes Filter' }).click();
		await this.page.getByPlaceholder('Notes Filter').fill(text);
	}

	/**
	 * Opens the account settings page and archives the account. An empty account
	 * is archivable; archiving redirects back to the account's detail page,
	 * which now shows only the archived notice.
	 */
	async archive(accountName: string) {
		await this.page.getByRole('link', { name: 'Account Settings' }).click();

		await this.page.getByRole('button', { name: 'Archive' }).click();

		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
		await expect(this.page.getByText('This account is archived')).toBeVisible();
	}

	/** The filtered-empty state's clear-filters action. */
	clearFiltersAction(): Locator {
		return this.page.getByRole('button', { name: 'Clear filters' });
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

	/**
	 * Creates a transfer from the currently-viewed account through the inline
	 * transfer create row (desktop register). The viewed account is one leg by
	 * definition; `counterpartAccount` is the other side, picked from the account
	 * dropdown. A positive amount arrives in the viewed account, a negative one
	 * leaves it — either way both legs are written.
	 */
	async createTransfer({
		amount,
		counterpartAccount,
		notes
	}: {
		amount: string;
		counterpartAccount: string;
		notes?: string;
	}) {
		await this.page.getByRole('button', { exact: true, name: 'Transfer' }).click();

		const createRow = this.page.getByRole('row', { exact: true, name: 'Transfer' });
		await expect(createRow).toBeVisible();

		await createRow.getByRole('button', { name: 'Open account dropdown' }).click();
		await this.page.getByRole('option', { name: counterpartAccount }).click();

		if (notes !== undefined) {
			await createRow.getByRole('textbox', { name: 'Notes' }).fill(notes);
		}

		await createRow.getByRole('textbox', { name: 'Amount' }).fill(amount);

		await createRow.getByRole('button', { exact: true, name: 'Save' }).click();
		await expect(createRow).not.toBeVisible();
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
		await this.page.getByRole('link', { name: 'Account Settings' }).click();
		await expect(this.page.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Account Name' }).clear();
		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);

		await this.page.getByRole('button', { name: 'Save Changes' }).click();

		// Saving stays on the settings page; the name-only title picks up the new name.
		await expect(this.page.getByRole('heading', { name })).toBeVisible();
	}

	/**
	 * Opens the account settings page and renames the account to `existingName`
	 * (another account in the same budget). Asserts the duplicate-name error
	 * surfaces as a field error on the page.
	 */
	async editNameExpectingError(existingName: string) {
		await this.page.getByRole('link', { name: 'Account Settings' }).click();
		await expect(this.page.getByRole('heading', { name: 'Change Account Name' })).toBeVisible();

		const nameInput = this.page.getByRole('textbox', { name: 'Account Name' });
		await nameInput.clear();
		await nameInput.fill(existingName);
		await this.page.getByRole('button', { name: 'Save Changes' }).click();

		await expect(this.page.getByText(`${existingName} already exists.`)).toBeVisible();
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
	 * Reopens the archived account by URL and asserts its detail page is
	 * read-only: the archived notice replaces the register, and there is no way
	 * to add transactions or reach the settings page.
	 */
	async openArchivedAccountAndVerifyReadOnly(accountName: string) {
		await this.goto(accountName);

		await expect(this.page.getByText('This account is archived')).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'New Transaction' })).toHaveCount(0);
		await expect(this.page.getByRole('link', { name: 'Account Settings' })).toHaveCount(0);
	}

	/** The desktop pagination summary ("Showing x - y of z"); hidden while the list is empty. */
	paginationInfo(): Locator {
		return this.page.getByText(/^Showing \d/);
	}

	/**
	 * From the budget month page: opens Budget Settings, then the stacked
	 * archived-accounts dialog, and restores the named account back into the
	 * settings account list.
	 */
	async restoreFromArchiveDialog(accountName: string) {
		await this.page.getByRole('button', { name: 'Budget Settings' }).click();
		const settings = this.page.getByRole('dialog').filter({ hasText: 'Budget Settings' });
		await settings.getByRole('button', { name: /archived$/ }).click();

		const archive = this.page.getByRole('dialog').filter({ hasText: 'Archived Accounts' });
		await archive
			.getByRole('listitem')
			.filter({ hasText: accountName })
			.getByRole('button', { name: 'Restore' })
			.click();

		// The account returns to the settings list; the archive dialog closes
		// itself once its last item is gone.
		await expect(settings.getByRole('link', { name: accountName })).toBeVisible();
	}

	/**
	 * Restores an account from the archived notice on its own detail page. The
	 * active register (with the New Transaction button) returns in place.
	 */
	async restoreFromDetail() {
		await this.page.getByRole('button', { name: 'Restore' }).click();

		await expect(this.page.getByRole('button', { name: 'New Transaction' })).toBeVisible();
	}

	/**
	 * Switches to another account through the desktop side-menu link. Unlike
	 * `goto`, this is a client-side (SPA) navigation, so the target account's
	 * cached transaction query is reused rather than refetched from a fresh
	 * document — the path that exercises counterpart-leg cache invalidation.
	 */
	async switchToAccountViaSideMenu(accountName: string) {
		// Scope to the navigation landmark: the same account name can also appear as
		// a link elsewhere (e.g. the month view's setup tutorial card).
		await this.page
			.getByRole('navigation')
			.getByRole('link', { exact: true, name: accountName })
			.click();
		await expect(this.page.getByRole('heading', { name: accountName })).toBeVisible();
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

	/** The truly-empty state's add-transaction action. */
	transactionsEmptyAction(): Locator {
		return this.page.getByRole('button', { name: 'Record your first transaction' });
	}

	/** The truly-empty register state shown when the account has no transactions at all. */
	transactionsEmptyState(): Locator {
		return this.page.getByText('No transactions yet');
	}

	/** The filtered-empty state shown when active filters match no transactions. */
	transactionsFilteredEmptyState(): Locator {
		return this.page.getByText('No transactions match your filters');
	}
}
