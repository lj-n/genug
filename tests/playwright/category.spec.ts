import { faker } from '@faker-js/faker';

import { test } from './fixture';

test('Create Category', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
	await pages.budget.createCategory(categoryName);
});

test('Edit Category Name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const categoryName = faker.commerce.department();
	await pages.budget.createCategory(categoryName);

	const newName = faker.commerce.department();
	await pages.category.editName(categoryName, newName);
});
