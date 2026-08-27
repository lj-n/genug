import { asMoney, formatMoney } from '$lib/utils/money';
import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

const eur = (value: number) => formatMoney({ currency: 'EUR', money: asMoney(value) });

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

test('Creating a transaction updates the balance summary without reload', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	// Start from a non-zero balance so the post-create total is distinct from the
	// single transaction's amount (100 + 42 = 142, not just 42).
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName, '100');

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(10000));

	await pages.account.createTransaction({ amount: '42', category: categoryName, validated: true });

	// The summary must reflect the new transaction with no manual reload.
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(14200));
	await expect(pages.account.balanceFigure('Validated')).toContainText(eur(14200));
	await expect(pages.account.balanceFigure('Pending')).toContainText(eur(0));
});

test('Validating, editing, and deleting a transaction each update the balance summary without reload', async ({
	pages
}) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	// A pending transaction: it counts toward the total but sits in `Pending`.
	await pages.account.createTransaction({ amount: '42', category: categoryName, validated: false });
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(4200));
	await expect(pages.account.balanceFigure('Pending')).toContainText(eur(4200));
	await expect(pages.account.balanceFigure('Validated')).toContainText(eur(0));

	// Validating moves it from pending to validated.
	await pages.account.toggleValidated();
	await expect(pages.account.balanceFigure('Validated')).toContainText(eur(4200));
	await expect(pages.account.balanceFigure('Pending')).toContainText(eur(0));

	// Editing the amount reflects in the total (validated stays on).
	await pages.account.editTransaction({ amount: '99' });
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(9900));
	await expect(pages.account.balanceFigure('Validated')).toContainText(eur(9900));

	// Deleting it clears the balance back to zero.
	await pages.account.deleteTransaction();
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(0));
});

test("Transfer updates the counterpart account's balance summary without reload", async ({
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
	await pages.budget.createAccount(accountA, '100');
	await pages.budget.createAccount(accountB, '50');

	// Visit account B first so its balance queries are cached client-side; the
	// bug is that a transfer created from another account fails to refresh this
	// cached summary, so it stays stale.
	await pages.account.switchToAccountViaSideMenu(accountB);
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(5000));

	// Create the transfer while viewing account A. A positive amount arrives in
	// the viewed account (A: 100 → 125) and the counterpart leg leaves B (50 → 25).
	await pages.account.switchToAccountViaSideMenu(accountA);
	await pages.account.createTransfer({ amount: '25', counterpartAccount: accountB });
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(12500));

	// Return to B via browser back, which restores B's cached query instances
	// rather than refetching them (a fresh navigation would refetch and mask the
	// bug). B's summary must already reflect the counterpart leg.
	await page.goBack();
	await expect(page.getByRole('heading', { name: accountB })).toBeVisible();
	await expect(pages.account.balanceFigure('Balance')).toContainText(eur(2500));
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

test('Filter state does not persist when switching accounts (#371)', async ({ page, pages }) => {
	// The desktop side menu (the cross-account switcher used below) only mounts at
	// the wide breakpoint; pin a desktop viewport so this runs the same way under
	// the tablet project.
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	// Budget one: two accounts (same-budget switch) plus a category to filter by.
	const budgetOne = faker.commerce.department();
	await pages.budget.createBudget(budgetOne);
	const accountA = uniqueName(faker.finance.accountName());
	const accountAsibling = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountA);
	await pages.budget.createAccount(accountAsibling);
	const category = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(category);

	// Budget two: a single account in a different budget (cross-budget switch).
	const budgetTwo = faker.commerce.department();
	await pages.budget.createAdditionalBudget(budgetTwo);
	const accountB = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountB);

	await pages.account.goto(accountA);
	await pages.account.applyCategoryFilter(category);
	await expect(page).toHaveURL(/categoryId=/);

	// Deep-link behaviour is unchanged: reloading the filtered URL restores it.
	await page.reload();
	await expect(page).toHaveURL(/categoryId=/);
	await expect(pages.account.categoryFilterTrigger()).toHaveText('1 selected');

	// Switching to another account in the same budget starts clean: no table
	// query params in the URL and no active filter chip.
	await pages.account.switchToAccountViaSideMenu(accountAsibling);
	await expect(page).toHaveURL(/^[^?]*$/);
	await expect(pages.account.categoryFilterTrigger()).toHaveCount(0);

	// Re-filter A, then switch to an account in a *different* budget — the foreign
	// category id must not leak onto its URL or into its filter UI.
	await pages.account.goto(accountA);
	await pages.account.applyCategoryFilter(category);
	await expect(page).toHaveURL(/categoryId=/);

	await pages.account.switchToAccountViaSideMenu(accountB);
	await expect(page).toHaveURL(/^[^?]*$/);
	await expect(pages.account.categoryFilterTrigger()).toHaveCount(0);
});

test('Deep link drops category filter ids foreign to the budget (#372)', async ({
	page,
	pages
}) => {
	// The filter dropdown used to capture real category ids lives in the desktop
	// register; pin a desktop viewport so this runs the same way under tablet.
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	// Budget one owns the account we deep-link into and one valid category.
	const budgetOne = faker.commerce.department();
	await pages.budget.createBudget(budgetOne);
	const account = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(account);
	const ownCategory = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(ownCategory);

	// Budget two owns a category that is foreign to budget one's account.
	const budgetTwo = faker.commerce.department();
	await pages.budget.createAdditionalBudget(budgetTwo);
	const foreignAccount = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(foreignAccount);
	const foreignCategory = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(foreignCategory);

	// Capture the foreign budget's real category id by filtering with it and
	// reading it back off the URL.
	await pages.account.goto(foreignAccount);
	await pages.account.applyCategoryFilter(foreignCategory);
	await expect(page).toHaveURL(/categoryId=/);
	const foreignId = new URL(page.url()).searchParams.get('categoryId')!;

	// Capture budget one's own category id the same way, and remember the
	// account's base path for the deep links below.
	await pages.account.goto(account);
	const accountPath = new URL(page.url()).pathname;
	await pages.account.applyCategoryFilter(ownCategory);
	await expect(page).toHaveURL(/categoryId=/);
	const ownId = new URL(page.url()).searchParams.get('categoryId')!;

	// A foreign-only deep link normalizes to a clean URL with no active filter.
	await page.goto(`${accountPath}?categoryId=${foreignId}`);
	await expect(page.getByRole('heading', { name: account })).toBeVisible();
	await expect(page).toHaveURL(/^[^?]*$/);
	await expect(pages.account.categoryFilterTrigger()).toHaveCount(0);

	// A mixed deep link keeps the budget's own id and drops only the foreign one.
	await page.goto(`${accountPath}?categoryId=${ownId}&categoryId=${foreignId}`);
	await expect(page.getByRole('heading', { name: account })).toBeVisible();
	await expect(pages.account.categoryFilterTrigger()).toHaveText('1 selected');
	await expect.poll(() => new URL(page.url()).searchParams.getAll('categoryId')).toEqual([ownId]);

	// The unassigned sentinel is budget-agnostic and survives the deep link.
	await page.goto(`${accountPath}?categoryId=__none__`);
	await expect(page.getByRole('heading', { name: account })).toBeVisible();
	await expect(pages.account.categoryFilterTrigger()).toHaveText('1 selected');
	await expect
		.poll(() => new URL(page.url()).searchParams.getAll('categoryId'))
		.toEqual(['__none__']);
});

test('Create-row category options reflect the budget after a cross-budget switch (#395)', async ({
	page,
	pages
}) => {
	// The desktop side menu (the cross-account switcher used below) only mounts at
	// the wide breakpoint; pin a desktop viewport so this runs the same way under
	// the tablet project.
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	// Budget one owns account A and its own category.
	const budgetOne = faker.commerce.department();
	await pages.budget.createBudget(budgetOne);
	const accountA = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountA);
	const categoryA = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryA);

	// Budget two owns account B and a different category.
	const budgetTwo = faker.commerce.department();
	await pages.budget.createAdditionalBudget(budgetTwo);
	const accountB = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountB);
	const categoryB = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryB);

	await pages.account.goto(accountA);

	// Build browser history across both budgets first: A -> B -> A. Returning
	// to B below via the browser's own back button (not a link click) restores
	// its cached page instance instead of triggering a fresh navigation — a
	// plain link click already closes the row through the dismiss layer, which
	// would mask this bug (see the sibling transfer-counterpart tests above for
	// the same cached-instance-reuse concern).
	await pages.account.switchToAccountViaSideMenu(accountB);
	await pages.account.switchToAccountViaSideMenu(accountA);

	// Leave the inline create-row open, then go back to account B (a different
	// budget) while it's still open. The row is not torn down by SvelteKit on
	// an account switch (this table component is reused across account pages),
	// so a row left open across a history navigation used to stay open with
	// its trigger button desynced from it, rather than being reset for the
	// account now in view.
	const newTransactionButton = page.getByRole('button', { name: 'New Transaction' });
	await newTransactionButton.click();
	await expect(page.getByRole('row', { name: 'New Transaction' })).toBeVisible();

	await page.goBack();
	await expect(page.getByRole('heading', { name: accountB })).toBeVisible();

	// The create affordance resets for the account now in view instead of
	// staying open against the one just navigated away from.
	await expect(newTransactionButton).toHaveAttribute('aria-expanded', 'false');

	// Reopening it lists only the newly active budget's category.
	await newTransactionButton.click();
	const createRow = page.getByRole('row', { name: 'New Transaction' });
	await createRow.getByRole('button', { name: 'Open category dropdown' }).click();
	const options = page.getByRole('option');

	await expect(options.filter({ hasText: categoryB })).toBeVisible();
	await expect(options.filter({ hasText: categoryA })).toHaveCount(0);
});

test('Edit-transaction form lists only the active budget categories after switching (#395)', async ({
	page,
	pages
}) => {
	// Seeding and the cross-account switch use the desktop side menu; the edit
	// *form* under test is the mobile sheet (below @3xl the register reflows to
	// cards and editing opens TransactionEditModal instead of the inline row).
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	const budgetOne = faker.commerce.department();
	await pages.budget.createBudget(budgetOne);
	const accountA = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountA);
	const categoryA = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryA);

	const budgetTwo = faker.commerce.department();
	await pages.budget.createAdditionalBudget(budgetTwo);
	const accountB = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountB);
	const categoryB = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryB);

	await pages.account.goto(accountA);
	await pages.account.createTransaction({ amount: '10', category: categoryA });

	await pages.account.switchToAccountViaSideMenu(accountB);
	await pages.account.createTransaction({ amount: '20', category: categoryB });

	await page.setViewportSize({ height: 667, width: 375 });
	await page.reload();

	// Opening the edit form (closed until now) after the switch shows only B's category.
	await page.getByRole('button', { name: 'Edit category' }).click();
	await page.getByRole('button', { name: 'Open category dropdown' }).click();
	let options = page.getByRole('option');
	await expect(options.filter({ hasText: categoryB })).toBeVisible();
	await expect(options.filter({ hasText: categoryA })).toHaveCount(0);
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Cancel' }).click();

	// Switching back (still at phone width, via the drawer nav) and reopening
	// the form shows only A's category.
	await page.getByRole('button', { name: 'Toggle Navigation' }).click();
	await page.getByRole('navigation').getByRole('link', { exact: true, name: accountA }).click();
	await expect(page.getByRole('heading', { name: accountA })).toBeVisible();

	await page.getByRole('button', { name: 'Edit category' }).click();
	await page.getByRole('button', { name: 'Open category dropdown' }).click();
	options = page.getByRole('option');
	await expect(options.filter({ hasText: categoryA })).toBeVisible();
	await expect(options.filter({ hasText: categoryB })).toHaveCount(0);
});

test('Category filter dropdown lists only the active budget categories after switching (#395)', async ({
	page,
	pages
}) => {
	await page.setViewportSize({ height: 900, width: 1440 });

	await pages.auth.createUserAndLogin();

	const budgetOne = faker.commerce.department();
	await pages.budget.createBudget(budgetOne);
	const accountA = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountA);
	const categoryA = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryA);

	const budgetTwo = faker.commerce.department();
	await pages.budget.createAdditionalBudget(budgetTwo);
	const accountB = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountB);
	const categoryB = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryB);

	await pages.account.goto(accountA);
	await pages.account.switchToAccountViaSideMenu(accountB);

	await page.getByRole('button', { name: 'Filter' }).click();
	await page.getByRole('menuitem', { name: 'Category Filter' }).click();
	await page.getByRole('button', { name: 'All Categories' }).click();

	const options = page.getByRole('option');
	await expect(options.filter({ hasText: categoryB })).toBeVisible();
	await expect(options.filter({ hasText: categoryA })).toHaveCount(0);
});
