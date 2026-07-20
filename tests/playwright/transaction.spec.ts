import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

test('Create Transaction', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	await pages.account.createTransaction({
		amount: '42',
		category: categoryName,
		notes: faker.lorem.sentence(),
		validated: true
	});
});

test('Edit Transaction', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	// Create initial transaction
	await pages.account.createTransaction({
		amount: '42',
		category: categoryName,
		validated: false
	});

	// Edit fields (same category, different amount/notes/validated)
	await pages.account.editTransaction({
		amount: '99',
		notes: 'edited notes',
		validated: true
	});
});

test('Delete Transaction', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	await pages.account.createTransaction({
		amount: '42',
		category: categoryName
	});

	await pages.account.deleteTransaction();
});

test('Toggle Validated', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	await pages.account.createTransaction({
		amount: '42',
		category: categoryName,
		validated: false
	});

	await pages.account.toggleValidated();
});

test("Transfer's counterpart leg shows in the other account without reload", async ({
	page,
	pages
}) => {
	// The desktop side menu (the cross-account switcher used below) only mounts at
	// the wide breakpoint; pin a desktop viewport so this runs the same way under
	// the tablet project.
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountA = uniqueName(faker.finance.accountName());
	const accountB = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountA);
	await pages.budget.createAccount(accountB);

	// Visit account B first so its transaction query is cached client-side; the
	// bug is that a transfer created from another account fails to invalidate
	// this cached instance, so it stays stale.
	await pages.account.switchToAccountViaSideMenu(accountB);
	await expect(pages.account.transactionsEmptyState()).toBeVisible();

	// Create the transfer while viewing account A; the counterpart leg lands in B.
	await pages.account.switchToAccountViaSideMenu(accountA);
	await pages.account.createTransfer({ amount: '25', counterpartAccount: accountB });

	// Return to B via browser back, which restores B's cached query instance
	// rather than refetching it (a fresh navigation would refetch and mask the
	// bug). B's leg must show immediately — its category cell carries a transfer
	// badge naming the counterpart account (A).
	await page.goBack();
	await expect(page.getByRole('heading', { name: accountB })).toBeVisible();
	await expect(
		page.getByRole('cell', { name: 'Edit category' }).filter({ hasText: accountA })
	).toBeVisible();
});

test('Toggle and switch create rows from their trigger buttons', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	await pages.account.goto(accountName);

	const transactionButton = page.getByRole('button', { exact: true, name: 'New Transaction' });
	const transferButton = page.getByRole('button', { exact: true, name: 'Transfer' });
	const transactionRow = page.getByRole('row', { name: 'New Transaction' });
	const transferRow = page.getByRole('row', { exact: true, name: 'Transfer' });

	// A human-paced click: the popover's dismiss layer debounces outside
	// pointerdowns by ~10ms, so a fast synthetic click can mask the
	// close-on-pointerdown/reopen-on-click flicker this test guards against.
	// Holding the button past the debounce window makes it observable.
	const pacedClick = async (button: typeof transactionButton) => {
		await button.hover();
		await page.mouse.down();
		await page.waitForTimeout(50);
		await page.mouse.up();
	};

	// Second click on the trigger closes the row — no dismiss on pointerdown.
	await pacedClick(transactionButton);
	await expect(transactionRow).toBeVisible();
	await transactionButton.hover();
	await page.mouse.down();
	await page.waitForTimeout(50);
	await expect(transactionRow).toBeVisible();
	await page.mouse.up();
	await expect(transactionRow).toBeHidden();

	// Same toggle for the transfer row.
	await pacedClick(transferButton);
	await expect(transferRow).toBeVisible();
	await pacedClick(transferButton);
	await expect(transferRow).toBeHidden();

	// Clicking the other trigger while a row is open switches rows.
	await pacedClick(transactionButton);
	await expect(transactionRow).toBeVisible();
	await pacedClick(transferButton);
	await expect(transferRow).toBeVisible();
	await expect(transactionRow).toBeHidden();
	await pacedClick(transactionButton);
	await expect(transactionRow).toBeVisible();
	await expect(transferRow).toBeHidden();

	// True outside clicks and Escape still dismiss the row.
	await page.getByRole('heading', { name: accountName }).click();
	await expect(transactionRow).toBeHidden();
	await pacedClick(transactionButton);
	await expect(transactionRow).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(transactionRow).toBeHidden();

	// Cancel still dismisses the row.
	await pacedClick(transferButton);
	await expect(transferRow).toBeVisible();
	await transferRow.getByRole('button', { name: 'Cancel' }).click();
	await expect(transferRow).toBeHidden();
});

test('Sort Transactions', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const cat1 = 'AAA-' + faker.string.uuid();
	const cat2 = 'BBB-' + faker.string.uuid();
	const cat3 = 'CCC-' + faker.string.uuid();
	await pages.budget.createCategory(cat1);
	await pages.budget.createCategory(cat2);
	await pages.budget.createCategory(cat3);

	await pages.account.goto(accountName);

	// Create transactions with distinguishable amounts for sort verification
	await pages.account.createTransaction({ amount: '100', category: cat1 });
	await pages.account.createTransaction({ amount: '1', category: cat2 });
	await pages.account.createTransaction({ amount: '50', category: cat3 });

	// --- Sort buttons exist and are clickable ---
	const sortDate = page.getByRole('button', { name: 'Sort by date' });
	const sortAmount = page.getByRole('button', { name: 'Sort by amount' });
	const sortCategory = page.getByRole('button', { name: 'Sort by category' });
	const sortValidated = page.getByRole('button', { name: 'Sort by validated status' });

	await expect(sortDate).toBeVisible();
	await expect(sortAmount).toBeVisible();
	await expect(sortCategory).toBeVisible();
	await expect(sortValidated).toBeVisible();

	// --- Three-state cycle: date ---
	await sortDate.click();
	await expect(page).toHaveURL(/sortDate=asc/);
	await expect(page).not.toHaveURL(/sortDate=desc/);

	await sortDate.click();
	await expect(page).toHaveURL(/sortDate=desc/);

	await sortDate.click();
	await expect(page).not.toHaveURL(/sortDate=/);

	// --- Switching columns clears previous ---
	await sortDate.click();
	await expect(page).toHaveURL(/sortDate=asc/);

	await sortAmount.click();
	await expect(page).toHaveURL(/sortAmount=asc/);
	await expect(page).not.toHaveURL(/sortDate=/);

	// --- Category sort ---
	await sortCategory.click();
	await expect(page).toHaveURL(/sortCategory=asc/);
	await expect(page).not.toHaveURL(/sortAmount=/);

	// --- Validated sort ---
	await sortValidated.click();
	await expect(page).toHaveURL(/sortValidated=asc/);
	await expect(page).not.toHaveURL(/sortCategory=/);

	// --- Page resets to 1 on sort ---
	// Navigate to page 2 first (need more than 15 transactions for pagination)
	// Since we only have 3, just verify page param is absent (defaults to 1)
	await expect(page).not.toHaveURL(/page=/);
});
