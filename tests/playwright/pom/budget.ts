import { expect, type Locator } from '@playwright/test';

import { BasePage } from './base-page';

export class BudgetPage extends BasePage {
	async assignAmount(categoryName: string, amount: string) {
		const budgetButton = this.categoryRow(categoryName).getByRole('button', { name: 'Budget' });
		// The table can re-render after a category change (SvelteKit invalidateAll
		// re-fetches the rows). A web-first assertion retries if the button is
		// briefly detached, which a bare click() would not.
		await expect(budgetButton).toBeVisible();
		await budgetButton.click();

		const input = this.page.getByRole('textbox', { name: 'Budget' });
		await input.fill(amount);
		await input.press('Enter');

		await expect(input).not.toBeVisible();
		await expect(budgetButton).toBeVisible();
	}

	/** Locates a category's row in the budget table by its (unique) name. */
	categoryRow(name: string): Locator {
		return this.page.getByRole('row').filter({ hasText: name });
	}

	/** The category table's empty-state CTA, shown while the budget has no categories. */
	categoryTableEmptyCta(): Locator {
		return this.page.getByRole('button', { name: 'Create a category' });
	}

	async createAccount(name: string, startingBalance = '0') {
		// Accounts live in the Budget Settings dialog now (#273); the Add Account
		// form is a nested dialog stacked over it (#294). Open settings, open the
		// account dialog, fill and submit.
		await this.page.getByRole('button', { name: 'Budget Settings' }).click();
		const settings = this.page.getByRole('dialog', { name: 'Budget Settings' });
		await settings.getByRole('button', { name: 'Add Account' }).click();

		const addDialog = this.page.getByRole('dialog', { name: 'Add New Account' });
		await addDialog.getByRole('textbox', { name: 'Account Name' }).fill(name);
		await addDialog
			.getByRole('textbox', { name: 'What is the current balance?' })
			.fill(startingBalance);

		await addDialog.getByRole('button', { name: 'Create Account' }).click();

		// Creates in place (no redirect): the account dialog closes and the new
		// account joins the settings list. Open its link to reach the account page
		// and capture the URL, then return to the budget page so subsequent
		// createCategory / assignAmount calls work.
		const accountLink = settings.getByRole('link', { name });
		await expect(accountLink).toBeVisible();
		await accountLink.click();
		await expect(this.page.getByRole('heading', { name })).toBeVisible();
		this.ctx.accounts.set(name, this.page.url());

		if (this.ctx.budgetUrl) {
			await this.page.goto(this.ctx.budgetUrl);
		}
	}

	/**
	 * Opens the create-account dialog and submits a name that already exists.
	 * Asserts the duplicate-name error surfaces as a field error and the dialog
	 * stays open (no redirect to a new account page).
	 */
	async createAccountExpectingError(name: string) {
		await this.page.getByRole('button', { name: 'Budget Settings' }).click();

		const settings = this.page.getByRole('dialog', { name: 'Budget Settings' });
		await settings.getByRole('button', { name: 'Add Account' }).click();

		const addDialog = this.page.getByRole('dialog', { name: 'Add New Account' });
		await addDialog.getByRole('textbox', { name: 'Account Name' }).fill(name);
		await addDialog.getByRole('button', { name: 'Create Account' }).click();

		await expect(addDialog.getByText(`${name} already exists.`)).toBeVisible();
		// The field error keeps the account dialog open — a successful create would
		// close it and add the account to the settings list instead.
		await expect(addDialog).toBeVisible();
	}

	/**
	 * Creates an account through the tutorial card's step-1 dialog. Unlike
	 * `createAccount`, this creates in place: the dialog closes and the card
	 * checks off step 1 without leaving the month view.
	 */
	async createAccountViaTutorial(name: string, startingBalance = '0') {
		await this.tutorialStepAction('account').click();
		await expect(this.page.getByRole('heading', { name: 'Add New Account' })).toBeVisible();
		// Regression: a suspending await in the form used to let the dialog open
		// without receiving focus, stranding keyboard users behind the overlay.
		await expect(this.page.locator('[data-slot="dialog-content"]')).toBeFocused();

		await this.page.getByRole('textbox', { name: 'Account Name' }).fill(name);
		await this.page
			.getByRole('textbox', { name: 'What is the current balance?' })
			.fill(startingBalance);
		await this.page.getByRole('button', { name: 'Create Account' }).click();

		await expect(this.page.getByRole('heading', { name: 'Add New Account' })).toBeHidden();
	}

	/**
	 * Creates a further budget once the user already has one — the `/new` page
	 * drops the "first budget" heading once a budget exists, so `createBudget`
	 * (which asserts it) can't be reused.
	 */
	async createAdditionalBudget(name: string) {
		await this.page.goto('/new');
		await expect(this.page.getByRole('heading', { name: 'Create New Budget Plan' })).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Budget Name' }).fill(name);
		await this.page.getByRole('button', { name: 'Create Budget' }).click();

		await expect(this.page.getByRole('heading', { name })).toBeVisible();
		this.ctx.budgetName = name;
		this.ctx.budgetUrl = this.page.url();
		this.ctx.budgetId = new URL(this.page.url()).pathname.split('/')[1];
	}

	async createBudget(name: string) {
		await this.page.goto('/new');
		await expect(
			this.page.getByRole('heading', { name: 'Create Your First Budget Plan' })
		).toBeVisible();

		await this.page.getByRole('textbox', { name: 'Budget Name' }).fill(name);
		await this.page.getByRole('button', { name: 'Create Budget' }).click();

		// createBudget redirects to /{budgetId}, which redirects again to the
		// current month page where the budget name is the heading.
		await expect(this.page.getByRole('heading', { name })).toBeVisible();
		this.ctx.budgetName = name;
		this.ctx.budgetUrl = this.page.url();
		// The budget id is the first path segment (the `(app)` group has no URL
		// segment): /{budgetId}/{month}. Captured for direct navigation to
		// budget-scoped pages like the standalone category create page.
		this.ctx.budgetId = new URL(this.page.url()).pathname.split('/')[1];
	}

	async createCategory(name: string) {
		// The quick-actions button only renders once a category exists; on a
		// fresh budget the first category comes from the table's empty-state
		// CTA ("Create a category") — both open the same quick dialog.
		await this.page.getByRole('button', { name: /^create (a )?category$/i }).click();

		const dialog = this.page.getByRole('dialog');
		const input = dialog.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		// A successful create closes the dialog; wait for it so callers don't race
		// the close animation (which briefly leaves two "Create Category" buttons).
		await expect(dialog).toBeHidden();

		const row = this.categoryRow(name);
		// The row button is rendered directly in the row (no async wait).
		await expect(row.getByRole('button', { exact: true, name })).toBeVisible();
		// CategoryAssignmentForm has its own `await getBudget()` — wait for the
		// Budget button to confirm it has mounted before returning. All rows share
		// the same getBudget cache, so this also unblocks other rows' buttons.
		await expect(row.getByRole('button', { name: 'Budget' })).toBeVisible();
	}

	/**
	 * Opens the quick category-create dialog and submits a name that already
	 * exists. Asserts the duplicate-name error surfaces as a field error and the
	 * dialog stays open (a successful create would close it).
	 */
	async createCategoryExpectingError(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const dialog = this.page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Add a new category' })).toBeVisible();

		await dialog.getByRole('textbox', { name: 'Category Name' }).fill(name);
		await dialog.getByRole('button', { name: 'Create Category' }).click();

		await expect(dialog.getByText(`${name} already exists.`)).toBeVisible();
		// The error keeps the dialog open — a successful create would close it.
		await expect(dialog).toBeVisible();
	}

	/**
	 * Opens the quick category dialog from the category table's empty-state CTA
	 * and creates a category. Unlike `createCategory`, the row assertion waits on
	 * the table replacing the empty state.
	 */
	async createCategoryViaTableCta(name: string) {
		await this.categoryTableEmptyCta().click();

		const dialog = this.page.getByRole('dialog');
		const input = dialog.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(dialog).toBeHidden();
		await expect(this.categoryRow(name)).toBeVisible();
	}

	/** Creates a category through the tutorial card's step-2 quick dialog. */
	async createCategoryViaTutorial(name: string) {
		await this.tutorialStepAction('category').click();

		const dialog = this.page.getByRole('dialog');
		const input = dialog.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(dialog).toBeHidden();
		await expect(this.categoryRow(name)).toBeVisible();
	}

	async goto(budgetName: string) {
		if (!this.ctx.budgetUrl) {
			throw new Error('createBudget must be called before goto');
		}
		await this.page.goto(this.ctx.budgetUrl);
		await expect(this.page.getByRole('heading', { name: budgetName })).toBeVisible();
	}

	/** The transfer trigger for a category; its label shows the "remaining" amount. */
	remainingTrigger(categoryName: string): Locator {
		return this.categoryRow(categoryName).getByRole('button', {
			name: `Adjust remaining for ${categoryName}`
		});
	}

	async transferToCategory(sourceCategoryName: string, amount: string, targetCategoryName: string) {
		await this.#openTransfer(sourceCategoryName);

		await this.page.getByRole('textbox', { name: 'Amount' }).fill(amount);
		await this.#selectTransferTarget(targetCategoryName);

		await this.page.getByRole('button', { exact: true, name: 'OK' }).click();
		await expect(this.page.getByRole('textbox', { name: 'Amount' })).not.toBeVisible();
	}

	async transferToUnassigned(categoryName: string, amount: string) {
		// "Unassigned" is the default pre-selection in the combobox (targetCategoryId = '').
		// Clicking it again doesn't change the value, so bits-ui keeps the dropdown open.
		// Skip the combobox and submit directly — the server treats an empty target as Unassigned.
		await this.#openTransfer(categoryName);
		await this.page.getByRole('textbox', { name: 'Amount' }).fill(amount);
		await this.page.getByRole('button', { exact: true, name: 'OK' }).click();
		await expect(this.page.getByRole('textbox', { name: 'Amount' })).not.toBeVisible();
	}

	/** The tutorial card region, shown while the budget lacks an account or a category. */
	tutorialCard(): Locator {
		return this.page.getByRole('region', { name: 'Set up your budget' });
	}

	/** The footer link to the first account (its name); absent until one exists. */
	tutorialFooterAccountLink(): Locator {
		return this.tutorialCard().getByRole('link');
	}

	/** A tutorial step's inline action button; only rendered while the step is open. */
	tutorialStepAction(step: 'account' | 'category'): Locator {
		return this.tutorialCard().getByRole('button', {
			name: step === 'account' ? 'Add account' : 'New category'
		});
	}

	async #openTransfer(categoryName: string) {
		const trigger = this.remainingTrigger(categoryName);
		await expect(trigger).toBeVisible();
		await trigger.click();
		await expect(this.page.getByRole('textbox', { name: 'Amount' })).toBeVisible();
	}

	async #selectTransferTarget(targetCategoryName: string) {
		await this.page.getByRole('button', { name: 'Select category' }).click();
		// The option label also contains the balance badge, so match by substring.
		const option = this.page.getByRole('option', { name: targetCategoryName });
		await option.click();
		// Selecting an item closes the combobox; wait for it so the OK button
		// underneath is no longer covered by the option list.
		await expect(option).not.toBeVisible();
	}
}
