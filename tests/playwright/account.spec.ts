import { faker } from '@faker-js/faker';

import { test } from './fixture';
import { uniqueName } from './unique-name';

test('Create Account', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);
});

test('Edit Account Name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	const newName = uniqueName(faker.finance.accountName());
	await pages.account.goto(accountName);
	await pages.account.editName(newName);
});
