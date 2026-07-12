import { asMoney, formatMoney } from '$lib/utils/money';
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
	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: 'Select next month' }).click();
	}

	await pages.budget.assignAmount(categoryName, '7');
	await expect(
		pages.budget.categoryRow(categoryName).getByRole('button', { name: 'Budget' })
	).toHaveText(formatMoney({ currency: 'EUR', money: asMoney(700) }));
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
