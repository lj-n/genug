import { faker } from '@faker-js/faker';

import { test } from './fixture';

test('Create Transaction', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	await pages.budget.goto(budgetName);

	const accountName = faker.finance.accountName();
	await pages.budget.createAccount(accountName);
	await pages.budget.goto(budgetName);

	const categoryName = faker.commerce.department();
	await pages.budget.createCategory(categoryName);

	await pages.account.goto(accountName);

	await pages.account.createTransaction('42');
});
