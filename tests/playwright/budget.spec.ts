import { formatCurrency } from '$lib/utils/format-currency';
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
		formatCurrency({ centValue: 300, currency: 'EUR' })
	);
	await expect(pages.budget.remainingTrigger(targetCategory)).toContainText(
		formatCurrency({ centValue: 200, currency: 'EUR' })
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
		formatCurrency({ centValue: 200, currency: 'EUR' })
	);

	// Unassigned: -200 (only 200 assigned total, 0 income)
	await expect(page.getByText(formatCurrency({ centValue: -200, currency: 'EUR' }))).toBeVisible();
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
