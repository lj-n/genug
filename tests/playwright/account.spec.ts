import { faker } from '@faker-js/faker';

import { test } from './fixture';

test('Create Account', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
});

test('Edit Account Name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);

	const newName = faker.finance.accountName();
	await pages.account.goto(accountName);
	await pages.account.editName(newName);
});
