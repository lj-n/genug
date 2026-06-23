import { faker } from '@faker-js/faker';

import { test } from './fixture';

test('Create Category', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	await pages.budget.goto(budgetName);

	const categoryName = faker.commerce.department();
	await pages.category.create(categoryName);
});

test('Edit Category Name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	await pages.budget.goto(budgetName);

	const categoryName = faker.commerce.department();
	await pages.category.create(categoryName);

	const newName = faker.commerce.department();
	await pages.category.editName(categoryName, newName);
});
