import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

test('Empty-state guidance across the fresh-budget journey', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	// A fresh budget shows the getting-started card in place of the table —
	// desktop column headers included.
	await expect(pages.budget.gettingStartedTitle()).toBeVisible();
	await expect(pages.budget.gettingStartedAccountStep()).toBeVisible();
	await expect(page.getByRole('columnheader', { name: 'Category' })).toHaveCount(0);

	// Navigator, quick actions, and unassigned summary stay put around the card.
	await expect(page.getByRole('button', { name: 'Select next month' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create Category' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Explain the unallocated amount' })).toBeVisible();

	// The account dropdown hints while no accounts exist.
	await pages.budget.openAccountsDropdown();
	await expect(pages.budget.accountDropdownEmptyHint()).toBeVisible();
	await page.keyboard.press('Escape');

	// Step 1 through the card's inline action.
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccountFromGettingStarted(accountName);

	// Back on the month view: step 1 is checked, the dropdown hint is gone.
	await expect(pages.budget.gettingStartedAccountStepDone()).toBeVisible();
	await expect(pages.budget.gettingStartedAccountStep()).toHaveCount(0);
	await pages.budget.openAccountsDropdown();
	await expect(pages.budget.accountDropdownEmptyHint()).toHaveCount(0);
	await expect(page.getByRole('menuitem', { name: accountName })).toBeVisible();
	await page.keyboard.press('Escape');

	// The account register explains itself, teaches the income convention, and
	// shows no pagination machinery.
	await pages.account.goto(accountName);
	await expect(pages.account.transactionsEmptyState()).toBeVisible();
	await expect(pages.account.transactionsIncomeHint()).toBeVisible();
	await expect(pages.account.paginationControls()).toHaveCount(0);

	// Recording the first transaction from the empty state restores the register.
	await pages.account.recordFirstTransaction('10');
	await expect(pages.account.transactionsEmptyState()).toHaveCount(0);
	await expect(pages.account.paginationControls()).toBeVisible();

	// A non-matching notes filter shows the filtered-empty state — never
	// onboarding copy — and clear-filters brings the rows back.
	await pages.account.filterByNotes('matches-no-transaction');
	await expect(pages.account.transactionsFilteredEmptyState()).toBeVisible();
	await expect(pages.account.transactionsEmptyState()).toHaveCount(0);
	await expect(pages.account.paginationControls()).toHaveCount(0);

	await pages.account.clearFiltersFromEmptyState();
	await expect(pages.account.transactionsFilteredEmptyState()).toHaveCount(0);
	await expect(pages.account.paginationControls()).toBeVisible();

	// The archived-accounts page (one click in via the dropdown) states its purpose.
	await pages.budget.goto(budgetName);
	await pages.budget.openAccountsDropdown();
	await page.getByRole('menuitem', { name: '0 archived' }).click();
	await expect(page.getByText('Accounts you archive will show up here.')).toBeVisible();

	// So does the archived-categories page.
	await pages.budget.goto(budgetName);
	await page.getByRole('link', { name: '0 archived' }).click();
	await expect(page.getByText('Categories you archive will show up here.')).toBeVisible();

	// Step 2: the first category removes the card for good and reveals the table.
	await pages.budget.goto(budgetName);
	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategoryFromGettingStarted(categoryName);
	await expect(pages.budget.gettingStartedTitle()).toHaveCount(0);
	await expect(page.getByRole('columnheader', { name: 'Category' })).toBeVisible();
});
