import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

// Spec #172: tutorial card and empty-state guidance on core screens.

test('Empty-state guidance — canonical first-run path', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	// The fresh budget shows the tutorial card with both steps open and a
	// footer that names the account without linking it yet.
	const card = pages.budget.tutorialCard();
	await expect(card).toBeVisible();
	await expect(pages.budget.tutorialStepAction('account')).toBeVisible();
	await expect(pages.budget.tutorialStepAction('category')).toBeVisible();
	await expect(card.getByText('your account')).toBeVisible();
	await expect(pages.budget.tutorialFooterAccountLink()).toHaveCount(0);

	// The category table renders its CTA empty state instead of header row + box.
	await expect(page.getByText('No categories yet')).toBeVisible();
	await expect(pages.budget.categoryTableEmptyCta()).toBeVisible();
	await expect(page.getByRole('columnheader', { exact: true, name: 'Category' })).toHaveCount(0);

	// Without a category there is nothing to navigate, assign, or archive: the
	// month navigator, quick actions, and unassigned summary are all absent.
	await expect(page.getByRole('button', { name: 'Select previous month' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Create Category' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Create Category' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Explain the unallocated amount' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: '0 archived' })).toHaveCount(0);

	// The account dropdown carries the no-accounts hint.
	await page.getByRole('button', { name: 'Show Accounts' }).click();
	await expect(page.getByText('No accounts yet — add one below.')).toBeVisible();
	await page.keyboard.press('Escape');

	// Both archived pages state what will appear there.
	await page.goto(`/${pages.budget.ctx.budgetId}/accounts/archived`);
	await expect(page.getByText('Archived accounts will show up here.')).toBeVisible();
	await page.goto(`/${pages.budget.ctx.budgetId}/categories/archived`);
	await expect(page.getByText('Archived categories will show up here.')).toBeVisible();
	await pages.budget.goto(budgetName);

	// Step 1: creating the account checks the step, removes the dropdown hint,
	// and turns the footer phrase into a link.
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccountViaTutorial(accountName);

	await expect(card).toBeVisible();
	await expect(pages.budget.tutorialStepAction('account')).toHaveCount(0);
	await expect(pages.budget.tutorialStepAction('category')).toBeVisible();

	await page.getByRole('button', { name: 'Show Accounts' }).click();
	await expect(page.getByRole('menuitem', { name: accountName })).toBeVisible();
	await expect(page.getByText('No accounts yet — add one below.')).toHaveCount(0);
	// With no archived accounts the dropdown omits the "0 archived" link (#171).
	await expect(page.getByRole('menuitem', { name: '0 archived' })).toHaveCount(0);
	await page.keyboard.press('Escape');

	// The footer link — now carrying the account's name — leads to the
	// truly-empty register: guidance with the income hint and the
	// add-transaction action, no pagination machinery.
	await expect(pages.budget.tutorialFooterAccountLink()).toHaveText(accountName);
	await pages.budget.tutorialFooterAccountLink().click();
	await expect(page.getByRole('heading', { name: accountName })).toBeVisible();
	await expect(pages.account.transactionsEmptyState()).toBeVisible();
	await expect(page.getByText('Income is simply a transaction without a category')).toBeVisible();
	await expect(pages.account.paginationInfo()).toHaveCount(0);

	// The empty state's action opens the create affordance; recording a
	// transaction replaces the empty state with the register.
	await pages.account.transactionsEmptyAction().click();
	const createRow = page.getByRole('row', { name: 'New Transaction' });
	await expect(createRow).toBeVisible();
	await createRow.getByRole('textbox', { name: 'Notes' }).fill('First income');
	await createRow.getByRole('textbox', { name: 'Amount' }).fill('100');
	await createRow.getByRole('button', { exact: true, name: 'Save' }).click();
	await expect(createRow).not.toBeVisible();
	await expect(pages.account.transactionsEmptyState()).toHaveCount(0);
	await expect(pages.account.paginationInfo()).toBeVisible();

	// A non-matching notes filter shows the filtered-empty state — never the
	// onboarding copy — and clear-filters restores the row.
	await pages.account.applyNotesFilter('no-such-note-zzz');
	await expect(pages.account.transactionsFilteredEmptyState()).toBeVisible();
	await expect(pages.account.transactionsEmptyState()).toHaveCount(0);
	await expect(pages.account.paginationInfo()).toHaveCount(0);

	await pages.account.clearFiltersAction().click();
	await expect(
		page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: 'First income' })
	).toBeVisible();

	// Step 2: creating the category completes the tutorial; the card leaves
	// and the table takes its place, headers included.
	await pages.budget.goto(budgetName);
	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategoryViaTutorial(categoryName);

	await expect(pages.budget.tutorialCard()).toHaveCount(0);
	await expect(page.getByRole('columnheader', { exact: true, name: 'Category' })).toBeVisible();

	// With a category the month affordances return — except the archived link,
	// which waits for the first archived category.
	await expect(page.getByRole('button', { name: 'Select previous month' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create Category' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Explain the unallocated amount' })).toBeVisible();
	await expect(page.getByRole('link', { name: '0 archived' })).toHaveCount(0);
});

// Regression (#167): a user who creates a category before an account must not
// lose the tutorial — the card stays with step 2 checked and step 1 open.
test('Tutorial card survives category-first setup', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategoryViaTableCta(categoryName);

	await expect(pages.budget.tutorialCard()).toBeVisible();
	await expect(pages.budget.tutorialStepAction('category')).toHaveCount(0);
	await expect(pages.budget.tutorialStepAction('account')).toBeVisible();

	// The table replaced its empty state and renders normally under the card.
	await expect(page.getByText('No categories yet')).toHaveCount(0);
	await expect(page.getByRole('columnheader', { exact: true, name: 'Category' })).toBeVisible();
	await expect(pages.budget.categoryRow(categoryName)).toBeVisible();

	// Completing step 1 removes the card.
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccountViaTutorial(accountName);
	await expect(pages.budget.tutorialCard()).toHaveCount(0);
});
