import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

test('Set a checkpoint that books an Adjustment', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	const accountName = uniqueName(faker.finance.accountName());
	// The starting balance is a validated transaction for €100.00.
	await pages.budget.createAccount(accountName, '100');

	await pages.account.goto(accountName);
	await pages.checkpoint.open();

	await expect(pages.checkpoint.backLink(accountName)).toBeVisible();
	await expect(page.getByTestId('checkpoint-validated')).toHaveText('€100.00');
	await expect(pages.checkpoint.adjustment()).toHaveText('—');
	await expect(pages.checkpoint.setButton()).toBeDisabled();
	await expect(page.getByText('Seals 1 transaction', { exact: true })).toBeVisible();
	await expect(pages.checkpoint.history()).toContainText('No checkpoints yet.');

	await pages.checkpoint.enterBankBalance('97.50');
	await expect(pages.checkpoint.adjustment()).toHaveText('-€2.50');
	await expect(page.getByText('Seals 2 transactions', { exact: true })).toBeVisible();

	await pages.checkpoint.submit();
	await expect(page.getByTestId('checkpoint-validated')).toHaveText('€97.50');
	await expect(pages.checkpoint.adjustment()).toHaveText('—');
	await expect(pages.checkpoint.historyEntries()).toHaveCount(1);
	await expect(pages.checkpoint.historyEntries().first()).toContainText('€97.50');
	await expect(pages.checkpoint.historyEntries().first()).toContainText(
		'2 sealed · Adjustment -€2.50'
	);

	await pages.checkpoint.backLink(accountName).click();
	await expect(page.getByRole('heading', { name: accountName })).toBeVisible();
	await expect(page.getByRole('row').filter({ hasText: 'Adjustment' })).toContainText('-€2.50');
	await expect(pages.account.balanceFigure('Validated')).toContainText('€97.50');
});

test('A matching balance turns the button into a success and books nothing', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName, '100');

	await pages.account.goto(accountName);
	await pages.checkpoint.open();

	await pages.checkpoint.enterBankBalance('100');
	await expect(pages.checkpoint.adjustment()).toHaveText('€0.00');
	await expect(page.getByText('Both sides match. Nothing to book.')).toBeVisible();
	await expect(pages.checkpoint.setButton()).toHaveClass(/text-success/);

	await pages.checkpoint.submit();
	await expect(page.getByTestId('checkpoint-validated')).toHaveText('€100.00');
});

test('Delete the latest checkpoint after confirming', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName, '100');

	await pages.account.goto(accountName);
	await pages.checkpoint.open();
	await pages.checkpoint.enterBankBalance('100');
	await pages.checkpoint.submit();
	await pages.checkpoint.enterBankBalance('90');
	await pages.checkpoint.submit();

	await expect(pages.checkpoint.historyEntries()).toHaveCount(2);
	await expect(pages.checkpoint.historyEntries().nth(0)).toContainText(
		'1 sealed · Adjustment -€10.00'
	);
	await expect(pages.checkpoint.historyEntries().nth(1)).toContainText('1 sealed');
	await expect(pages.checkpoint.historyEntries().nth(1)).not.toContainText('Adjustment');
	// Only the newest entry offers Delete.
	await expect(pages.checkpoint.history().getByRole('button', { name: 'Delete' })).toHaveCount(1);
	await expect(
		pages.checkpoint.historyEntries().nth(0).getByRole('button', { name: 'Delete' })
	).toBeVisible();

	const description = await pages.checkpoint.deleteLatest();
	expect(description).toMatch(
		/^The checkpoint from .+ is removed and its 1 transaction can be edited again\. Its Adjustment stays as an ordinary transaction\.$/
	);

	// The Adjustment stays, unsealed, so the next Checkpoint would seal it again.
	await expect(page.getByTestId('checkpoint-validated')).toHaveText('€90.00');
	await expect(page.getByText('Seals 1 transaction', { exact: true })).toBeVisible();
	await expect(pages.checkpoint.historyEntries().first()).not.toContainText('Adjustment');

	const lastDescription = await pages.checkpoint.deleteLatest();
	expect(lastDescription).not.toContain('Adjustment');
	await expect(pages.checkpoint.history()).toContainText('No checkpoints yet.');
	await expect(page.getByText('Seals 2 transactions', { exact: true })).toBeVisible();
});

test('An archived account shows the archived notice instead of the form', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);

	await pages.account.goto(accountName);
	await pages.checkpoint.open();
	const checkpointUrl = page.url();
	await pages.checkpoint.enterBankBalance('0');
	await pages.checkpoint.submit();

	await pages.account.goto(accountName);
	await pages.account.archive(accountName);
	await expect(page.getByRole('link', { exact: true, name: 'Checkpoint' })).toHaveCount(0);

	await page.goto(checkpointUrl);
	await expect(page.getByText('This account is archived')).toBeVisible();
	await expect(pages.checkpoint.bankInput()).toHaveCount(0);
	// The history stays readable, but deleting is rejected on an archived account.
	await expect(pages.checkpoint.historyEntries()).toHaveCount(1);
	await expect(pages.checkpoint.history().getByRole('button', { name: 'Delete' })).toHaveCount(0);
});
