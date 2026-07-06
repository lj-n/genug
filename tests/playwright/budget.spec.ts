import { formatCurrency } from '$lib/utils/format-currency';
import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';

test('Assign Budget to Category', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
	await pages.budget.goto(budgetName);

	const categoryName = faker.commerce.department();
	await pages.budget.createCategory(categoryName);

	await pages.budget.assignAmount(categoryName, '500');
});

test('Transfer Assignment — Move between categories', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
	await pages.budget.goto(budgetName);

	const sourceCategory = faker.commerce.department();
	await pages.budget.createCategory(sourceCategory);
	const targetCategory = faker.commerce.department();
	await pages.budget.createCategory(targetCategory);

	// Assign 500 (cents) to source
	await pages.budget.assignAmount(sourceCategory, '5');

	// Move 200 from source to target
	await pages.budget.transferToCategory(sourceCategory, '2', targetCategory);

	// Verify: source remaining = 300, target remaining = 200
	const sourceRow = page.getByRole('row').filter({ hasText: sourceCategory });
	const targetRow = page.getByRole('row').filter({ hasText: targetCategory });
	await expect(sourceRow.getByRole('cell').nth(3)).toContainText(
		formatCurrency({ centValue: 300, currency: 'EUR' })
	);
	await expect(targetRow.getByRole('cell').nth(3)).toContainText(
		formatCurrency({ centValue: 200, currency: 'EUR' })
	);
});

test('Transfer Assignment — Move to unassigned', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
	await pages.budget.goto(budgetName);

	const category = faker.commerce.department();
	await pages.budget.createCategory(category);

	// Assign 500
	await pages.budget.assignAmount(category, '5');

	// Move 300 to unassigned
	await pages.budget.transferToUnassigned(category, '3');

	// Verify remaining = 200
	const categoryRow = page.getByRole('row').filter({ hasText: category });
	await expect(categoryRow.getByRole('cell').nth(3)).toContainText(
		formatCurrency({ centValue: 200, currency: 'EUR' })
	);

	// Unassigned: -200 (only 200 assigned total, 0 income)
	await expect(page.getByText(formatCurrency({ centValue: -200, currency: 'EUR' }))).toBeVisible();
});

test('Transfer Assignment — Trigger disabled at zero remaining', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
	await pages.budget.goto(budgetName);

	const category = faker.commerce.department();
	await pages.budget.createCategory(category);

	// No assignment → remaining = 0 → trigger disabled
	const categoryRow = page.getByRole('row').filter({ hasText: category });
	const remainingCell = categoryRow.getByRole('cell').nth(3);
	const trigger = remainingCell.getByRole('button');

	await expect(trigger).toHaveAttribute('aria-disabled', 'true');
});
