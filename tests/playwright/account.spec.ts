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

test('Account create shows a field error for a duplicate name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	await pages.budget.createAccountExpectingError(accountName);
});

test('Account archive redirects, makes the account read-only, and restores in place', async ({
	pages
}) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	await pages.account.goto(accountName);
	await pages.account.archive(accountName);
	// Reopening the archived account must not allow adding transactions.
	await pages.account.openArchivedAccountAndVerifyReadOnly(accountName);
	await pages.account.restoreFromDetail();
});

test('Account rename shows a field error for a duplicate name', async ({ pages }) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const existingName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(existingName);

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	await pages.account.goto(accountName);
	await pages.account.editNameExpectingError(existingName);
});
