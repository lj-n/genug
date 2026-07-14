import { faker } from '@faker-js/faker';

import type { Page } from './fixture';
import type { Pages } from './pom';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

/**
 * Narrow-viewport coverage for the core flows (#133, ADR-0014): the content
 * tables reflow to stacked lists below the shared @3xl container threshold and
 * mutations go through the bottom sheet.
 *
 * Seeding runs at the project's default viewport (the POM navigation assumes a
 * desktop/tablet layout); each flow under test then shrinks to an iPhone-SE
 * viewport and drives the reflowed UI.
 */
const PHONE_VIEWPORT = { height: 667, width: 375 };

async function expectNoHorizontalOverflow(page: Page) {
	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBeLessThanOrEqual(widths.client);
}

async function seedBudget(
	pages: Pages,
	names: { budgetName?: string; categoryName?: string } = {}
) {
	await pages.auth.createUserAndLogin();
	const budgetName = names.budgetName ?? faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);
	const categoryName = names.categoryName ?? uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
	return { accountName, budgetName, categoryName };
}

test('Login works at phone width', async ({ page, pages }) => {
	const user = await pages.auth.createUserAndLogin();
	await pages.auth.signout();

	await page.setViewportSize(PHONE_VIEWPORT);
	await page.goto('/login');
	await expectNoHorizontalOverflow(page);

	// login() verifies the session through the mobile navigation drawer.
	await pages.auth.login(...user);
});

test('Month view reflows to category cards without horizontal overflow', async ({
	page,
	pages
}) => {
	// Long names regression: the page title and category name used to floor the
	// page's min-content width and force page-level horizontal overflow.
	const { budgetName, categoryName } = await seedBudget(pages, {
		budgetName: uniqueName('Haushaltsbudget der Familie'),
		categoryName: uniqueName('Lebensmittel und Haushaltswaren')
	});

	await page.setViewportSize(PHONE_VIEWPORT);
	await pages.budget.goto(budgetName);
	await expectNoHorizontalOverflow(page);

	// Month navigator and the full-width unassigned band are stacked but present.
	await expect(page.getByRole('button', { name: 'Select previous month' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Explain the unallocated amount' })).toBeVisible();

	// The category card carries the mobile affordances; the dense table
	// (its column headers and drag handle) is gone from the accessibility tree.
	const row = pages.budget.categoryRow(categoryName);
	await expect(row.getByRole('button', { name: 'Budget' })).toBeVisible();
	await expect(page.getByRole('columnheader', { name: 'Activity' })).toBeHidden();
	await expect(row.getByRole('button', { name: 'Drag Handle' })).toBeHidden();
});

test('Add transaction through the bottom sheet', async ({ page, pages }) => {
	const { accountName, categoryName } = await seedBudget(pages);

	await page.setViewportSize(PHONE_VIEWPORT);
	await page.goto(pages.budget.ctx.accounts.get(accountName)!);
	await expectNoHorizontalOverflow(page);

	// An active filter row (its category select had a fixed 320px minimum)
	// must not widen the register either.
	await page.getByRole('button', { name: 'Filter' }).click();
	await page.getByRole('menuitem', { name: 'Category Filter' }).click();
	await expect(page.getByText('All Categories')).toBeVisible();
	await expectNoHorizontalOverflow(page);

	await page.getByRole('button', { name: 'New Transaction' }).click();

	const sheet = page.locator('[data-slot="drawer-content"]');
	await expect(sheet).toBeVisible();
	await expect(sheet).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

	await sheet.getByRole('button', { name: 'Open category dropdown' }).click();
	await page.getByRole('option', { name: categoryName }).click();
	await sheet.getByRole('textbox', { name: 'Notes' }).fill('Phone entry');
	await sheet.getByRole('textbox', { name: 'Amount' }).fill('100');
	await sheet.getByRole('button', { exact: true, name: 'Save' }).click();
	await expect(sheet).not.toBeVisible();

	// The new transaction lands as a card in the date-grouped mobile register.
	await expect(
		page.getByRole('button', { name: 'Edit category' }).filter({ hasText: categoryName })
	).toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: 'Phone entry' })
	).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('Edit a transaction through the bottom sheet', async ({ page, pages }) => {
	const { accountName, categoryName } = await seedBudget(pages);
	// Seed the transaction at the default viewport via the inline create row.
	await page.goto(pages.budget.ctx.accounts.get(accountName)!);
	await pages.account.createTransaction({ amount: '42', category: categoryName });

	await page.setViewportSize(PHONE_VIEWPORT);
	await page.goto(pages.budget.ctx.accounts.get(accountName)!);

	await page
		.getByRole('button', { name: 'Edit category' })
		.filter({ hasText: categoryName })
		.click();

	const sheet = page.locator('[data-slot="drawer-content"]');
	await expect(sheet).toBeVisible();
	await sheet.getByRole('textbox', { name: 'Notes' }).fill('Edited on the phone');
	await sheet.getByRole('button', { exact: true, name: 'Save' }).click();
	await expect(sheet).not.toBeVisible();

	await expect(
		page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: 'Edited on the phone' })
	).toBeVisible();
});

test('Assign money to a category through the bottom sheet', async ({ page, pages }) => {
	const { budgetName, categoryName } = await seedBudget(pages);

	await page.setViewportSize(PHONE_VIEWPORT);
	await pages.budget.goto(budgetName);

	const row = pages.budget.categoryRow(categoryName);
	await row.getByRole('button', { name: 'Budget' }).click();

	const sheet = page.locator('[data-slot="drawer-content"]');
	await expect(sheet).toBeVisible();
	await sheet.getByRole('textbox', { name: 'Budget' }).fill('100');
	await sheet.getByRole('button', { exact: true, name: 'Save' }).click();
	await expect(sheet).not.toBeVisible();

	await expect(row.getByRole('button', { name: 'Budget' })).toContainText('100');
	await expectNoHorizontalOverflow(page);
});

test('Add account and category at phone width', async ({ page, pages }) => {
	await pages.auth.createUserAndLogin();
	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	await page.setViewportSize(PHONE_VIEWPORT);
	await pages.budget.goto(budgetName);

	await pages.budget.createAccount(uniqueName(faker.finance.accountName()));

	// Below the md breakpoint the quick action routes to the standalone
	// category form page instead of the inline dialog.
	const categoryName = uniqueName(faker.commerce.department());
	await page.getByRole('link', { name: 'Create Category' }).click();
	await expect(page.getByRole('heading', { name: 'Add a new category' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
	await page.getByRole('textbox', { name: 'Category Name' }).fill(categoryName);
	await page.getByRole('button', { name: 'Create Category' }).click();

	// Success navigates back to the budget's month view.
	await expect(pages.budget.categoryRow(categoryName)).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
