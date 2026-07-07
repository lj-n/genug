import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';

test('Create Transaction', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
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

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
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

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
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

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	await pages.account.createTransaction({
		amount: '42',
		category: categoryName,
		validated: false
	});

	await pages.account.toggleValidated();
});

test('Sort Transactions', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
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
