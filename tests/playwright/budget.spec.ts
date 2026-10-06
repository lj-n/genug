import { asMoney, formatMoney } from '$lib/utils/money';
import { addMonths } from '$lib/utils/month';
import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

test('Assign Budget to Category', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	await pages.budget.assignAmount(categoryName, '500');
});

// Regression: after client-side month navigation the previous month's query
// instances linger in the client cache until the browser GCs them. The form's
// single-flight refresh requests all of them, and a server-side
// requested(..., 1) limit rejected the visible month's refresh with a 400 —
// the assignment saved, but the table stayed stale. Full-page loads
// (page.goto) reset the client cache and can never hit this.
test('Assign Budget after client-side month navigation refreshes the table', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();

	await pages.budget.createBudget(faker.commerce.department());

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	// Client-side navigation — each hop leaves the previous month's query
	// instances in the client cache until GC. Several hops raise the odds
	// that at least one stale instance is still around at submit time.
	const targetMonth = addMonths(pages.budget.displayedMonth(), 3);
	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: 'Select next month' }).click();
	}
	await pages.budget.waitForMonth(targetMonth);

	await pages.budget.assignAmount(categoryName, '7');
	await pages.budget.expectAssigned(categoryName, 700);
});

// Regression (#420): the URL commits a month navigation right away, but the
// previous month's table stays rendered until the target month's rows load.
// That stale table must not take assignments — they would post the old month.
test('Assigning while a month navigation is loading changes no month', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	await pages.budget.createBudget(faker.commerce.department());

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
	await pages.budget.assignAmount(categoryName, '5');

	const startMonth = pages.budget.displayedMonth();
	const targetMonth = addMonths(startMonth, 1);

	const releaseMonthRows = await pages.budget.holdMonthRows();
	await page.getByRole('button', { name: 'Select next month' }).click();
	await pages.budget.waitForMonthUrl(targetMonth);
	await expect(pages.budget.categoryTable()).toHaveAttribute('aria-busy', 'true');

	// Assign on the previous month's rows, still on screen. `force` skips
	// Playwright's actionability wait and clicks the way a user would.
	await pages.budget.assignedButton(categoryName).click({ force: true });
	await page.keyboard.type('7');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('textbox', { name: 'Budget' })).toBeHidden();

	releaseMonthRows();
	await pages.budget.waitForMonth(targetMonth);
	await pages.budget.expectAssigned(categoryName, 0);

	await page.goBack();
	await pages.budget.waitForMonth(startMonth);
	await pages.budget.expectAssigned(categoryName, 500);

	// Once loaded, the target month takes the assignment, and a full reload
	// of that month still shows it.
	await page.goForward();
	await pages.budget.waitForMonth(targetMonth);
	await pages.budget.assignAmount(categoryName, '7');
	await pages.budget.expectAssigned(categoryName, 700);
	await page.reload();
	await pages.budget.expectAssigned(categoryName, 700);
});

// Regression (#421): a month hop that finished loading after a later click
// reset the navigator to its month, so the next click stepped from there and
// the user landed one month short.
test('Rapid month clicks move one month each while months are loading', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	await pages.budget.createBudget(faker.commerce.department());
	await pages.budget.createCategory(uniqueName(faker.commerce.department()));

	const startMonth = pages.budget.displayedMonth();
	const next = page.getByRole('button', { name: 'Select next month' });
	const previous = page.getByRole('button', { name: 'Select previous month' });

	let releaseMonthRows = await pages.budget.holdMonthRows();
	await next.click();
	await next.click();
	releaseMonthRows();
	await pages.budget.waitForMonth(addMonths(startMonth, 2));
	await next.click();
	await pages.budget.waitForMonth(addMonths(startMonth, 3));

	releaseMonthRows = await pages.budget.holdMonthRows();
	await previous.click();
	await previous.click();
	releaseMonthRows();
	await pages.budget.waitForMonth(addMonths(startMonth, 1));
	await previous.click();
	await pages.budget.waitForMonth(startMonth);
});

// The transfer panel and the phone assign sheet render outside the table, so
// the table's busy guard does not cover them. Left open across a history
// navigation, they would post the month the user just left.
test('Transfer panel closes when a history navigation changes the month', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();

	await pages.budget.createBudget(faker.commerce.department());

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	const startMonth = pages.budget.displayedMonth();
	await page.getByRole('button', { name: 'Select next month' }).click();
	await pages.budget.waitForMonth(addMonths(startMonth, 1));
	await pages.budget.assignAmount(categoryName, '5');
	await pages.budget.openTransfer(categoryName);

	const releaseMonthRows = await pages.budget.holdMonthRows();
	await page.goBack();
	await pages.budget.waitForMonthUrl(startMonth);
	await expect(pages.budget.transferAmountInput()).toBeHidden();

	releaseMonthRows();
	await pages.budget.waitForMonth(startMonth);
});

test('Assign sheet closes when a history navigation changes the month', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	await pages.budget.createBudget(faker.commerce.department());

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	// Below the table breakpoint, Budget opens the assign sheet instead of the
	// inline field.
	await page.setViewportSize({ height: 720, width: 390 });
	const startMonth = pages.budget.displayedMonth();
	await page.getByRole('button', { name: 'Select next month' }).click();
	await pages.budget.waitForMonth(addMonths(startMonth, 1));
	await pages.budget.assignedButton(categoryName).click();
	const sheet = page.getByRole('dialog');
	await expect(sheet).toBeVisible();

	const releaseMonthRows = await pages.budget.holdMonthRows();
	await page.goBack();
	await pages.budget.waitForMonthUrl(startMonth);
	await expect(sheet).toBeHidden();

	releaseMonthRows();
	await pages.budget.waitForMonth(startMonth);
});

test('Transfer Assignment — Move between categories', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const sourceCategory = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(sourceCategory);
	const targetCategory = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(targetCategory);

	// Assign 500 (cents) to source
	await pages.budget.assignAmount(sourceCategory, '5');

	// Move 200 from source to target
	await pages.budget.transferToCategory(sourceCategory, '2', targetCategory);

	// Verify: source remaining = 300, target remaining = 200
	await expect(pages.budget.remainingTrigger(sourceCategory)).toContainText(
		formatMoney({ currency: 'EUR', money: asMoney(300) })
	);
	await expect(pages.budget.remainingTrigger(targetCategory)).toContainText(
		formatMoney({ currency: 'EUR', money: asMoney(200) })
	);
});

test('Transfer Assignment — Move to unassigned', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const category = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(category);

	// Assign 500
	await pages.budget.assignAmount(category, '5');

	// Move 300 to unassigned
	await pages.budget.transferToUnassigned(category, '3');

	// Verify remaining = 200
	await expect(pages.budget.remainingTrigger(category)).toContainText(
		formatMoney({ currency: 'EUR', money: asMoney(200) })
	);

	// Unassigned: -200 (only 200 assigned total, 0 income)
	await expect(
		page.getByText(formatMoney({ currency: 'EUR', money: asMoney(-200) }))
	).toBeVisible();
});

test('Transfer Assignment — Trigger disabled at zero remaining', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const category = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(category);

	// No assignment → remaining = 0 → trigger disabled
	await expect(pages.budget.remainingTrigger(category)).toHaveAttribute('aria-disabled', 'true');
});
