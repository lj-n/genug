import { faker } from '@faker-js/faker';

import { test } from './fixture';
import { uniqueName } from './unique-name';

test('Create Category', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
});

test('Edit Category Name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);

	const newName = uniqueName(faker.commerce.department());
	await pages.category.editName(categoryName, newName);
});
