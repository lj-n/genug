import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';

import type { Locator, Page } from './fixture';
import type { Pages } from './pom';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

/**
 * Accessibility gate for the core flows (#136, spec #128 T8, ADR-0016).
 *
 * Bounded to WCAG 2.1 AA on the core flows — add transaction, assign money,
 * view month, add account/category, login, plus transfers (co-located in the
 * register). axe runs at every *meaningful interactive state*, not just the
 * static page: a static-only gate would pass while the dense create row and the
 * modals stayed broken. States are reached through the existing page objects.
 *
 * The `best-practice` tag is deliberately excluded — it flags non-required
 * rules and would turn the gate into noise.
 */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];

/** Asserts the current DOM is axe-clean, printing each violation on failure. */
async function expectAxeClean(page: Page) {
	// Contrast is judged at rest: a modal sampled mid-fade reports a diluted
	// colour (a false failure). Jump every running animation/transition — CSS and
	// Web Animations API alike — to its end state before axe reads the DOM.
	await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));

	const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();

	const report = violations
		.map(
			(v) =>
				`[${v.impact}] ${v.id}: ${v.help}\n` +
				v.nodes.map((n) => `    ${n.target.join(' ')}`).join('\n')
		)
		.join('\n');

	expect(violations, report).toEqual([]);
}

async function seedBudget(pages: Pages) {
	await pages.auth.createUserAndLogin();
	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);
	const accountName = uniqueName(faker.finance.accountName());
	const secondAccountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);
	await pages.budget.createAccount(secondAccountName);
	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
	return { accountName, budgetName, categoryName, secondAccountName };
}

/**
 * Contrast must hold in BOTH themes (#136), so every flow runs twice. The theme
 * is forced through the `theme` override cookie (ADR-0010), which the request
 * pipeline resolves to an `<html>` class server-side — the same path a real
 * user's Settings override takes.
 */
const THEMES = ['light', 'dark'] as const;

async function setTheme(page: Page, theme: (typeof THEMES)[number]) {
	await page
		.context()
		.addCookies([{ domain: 'localhost', name: 'theme', path: '/', value: theme }]);
}

for (const theme of THEMES) {
	test.describe(`${theme} theme`, () => {
		test.beforeEach(async ({ page }) => setTheme(page, theme));

		test('Login page is axe-clean', async ({ page, pages }) => {
			// A registered user exists, so `/login` renders the returning-user form
			// (not the first-run admin creation screen).
			await pages.auth.createUserAndLogin();
			await pages.auth.signout();

			await page.goto('/login');
			await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
			await expectAxeClean(page);
		});

		test('Month view — view, assign, and reassign are axe-clean', async ({ page, pages }) => {
			const { budgetName, categoryName } = await seedBudget(pages);
			await pages.budget.goto(budgetName);

			// View month: the budget table with its category rows and unassigned summary.
			await expect(page.getByRole('columnheader', { exact: true, name: 'Category' })).toBeVisible();
			await expectAxeClean(page);

			// Assign money: the inline budget-amount popover open over the row.
			const budgetButton = pages.budget
				.categoryRow(categoryName)
				.getByRole('button', { name: 'Budget' });
			await budgetButton.click();
			const budgetInput = page.getByRole('textbox', { name: 'Budget' });
			await expect(budgetInput).toBeVisible();
			await expectAxeClean(page);
			// Commit the assignment so the category has remaining to reassign below.
			await budgetInput.fill('50');
			await budgetInput.press('Enter');
			await expect(budgetInput).not.toBeVisible();

			// Reassign (move remaining between categories): the adjust-remaining popover.
			await pages.budget.remainingTrigger(categoryName).click();
			await expect(page.getByRole('textbox', { name: 'Amount' })).toBeVisible();
			await expectAxeClean(page);
			await page.keyboard.press('Escape');
		});

		test('Add category and add account dialogs are axe-clean', async ({ page, pages }) => {
			const { budgetName, categoryName } = await seedBudget(pages);
			await pages.budget.goto(budgetName);

			// Add category: the quick-create dialog.
			await page.getByRole('button', { name: 'Create Category' }).click();
			const categoryDialog = page.getByRole('dialog');
			await expect(
				categoryDialog.getByRole('heading', { name: 'Add a new category' })
			).toBeVisible();
			await expectAxeClean(page);

			// Validation-error state: a duplicate name renders an inline field error
			// (role="alert", error-token text) that axe must also find clean.
			const categoryNameInput = categoryDialog.getByRole('textbox', { name: 'Category Name' });
			await categoryNameInput.fill(categoryName);
			await categoryNameInput.press('Enter');
			await expect(categoryDialog.getByText(`${categoryName} already exists.`)).toBeVisible();
			await expectAxeClean(page);

			await page.keyboard.press('Escape');
			await expect(categoryDialog).not.toBeVisible();

			// Add account: the create-account form is a nested dialog stacked over
			// the Budget Settings dialog (#294). Scan both surfaces together.
			await page.getByRole('button', { name: 'Budget Settings' }).click();
			const settingsDialog = page.getByRole('dialog', { name: 'Budget Settings' });
			await settingsDialog.getByRole('button', { name: 'Add Account' }).click();
			const addAccountDialog = page.getByRole('dialog', { name: 'Add New Account' });
			await expect(addAccountDialog.getByRole('textbox', { name: 'Account Name' })).toBeVisible();
			await expectAxeClean(page);
		});

		test('Transaction register — read, create, transfer, and edit are axe-clean', async ({
			page,
			pages
		}) => {
			// seedBudget creates a second account too, so the transfer row's
			// destination dropdown has an option to offer.
			const { accountName, categoryName } = await seedBudget(pages);
			await pages.account.goto(accountName);

			// Seed a populated register: one income row and one categorised expense.
			await pages.account.createTransaction({ amount: '1000', notes: 'Salary' });
			await pages.account.createTransaction({
				amount: '-25',
				category: categoryName,
				notes: 'Lunch'
			});

			// Read: the populated register with header, rows, and pagination.
			await expect(page.getByRole('button', { name: 'New Transaction' })).toBeVisible();
			await expect(
				page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: 'Salary' })
			).toBeVisible();
			await expectAxeClean(page);

			// Create: the inline transaction create row.
			await page.getByRole('button', { name: 'New Transaction' }).click();
			await expect(page.getByRole('row', { name: 'New Transaction' })).toBeVisible();
			await expectAxeClean(page);
			await page.keyboard.press('Escape');

			// Transfer: the inline transfer create row (destination = second account).
			await page.getByRole('button', { exact: true, name: 'Transfer' }).click();
			await expect(page.getByRole('row', { exact: true, name: 'Transfer' })).toBeVisible();
			await expectAxeClean(page);
			await page.keyboard.press('Escape');

			// Edit: the inline edit row over an existing transaction.
			await page
				.getByRole('row')
				.filter({ has: page.getByRole('cell', { name: 'Edit category' }) })
				.first()
				.getByRole('cell', { name: 'Edit category' })
				.click();
			await expect(
				page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Save' }) })
			).toBeVisible();
			await expectAxeClean(page);
		});
	});
}

/** Tabs forward until the given locator holds focus, or throws after `max` hops. */
async function tabToFocus(page: Page, target: Locator, max = 10) {
	for (let i = 0; i < max; i++) {
		if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
		await page.keyboard.press('Tab');
	}
	await expect(target).toBeFocused();
}

// D5 (ADR-0016): the dense transaction create row is the one flow where keyboard
// order genuinely breaks, so it gets an automated keyboard-only test; the simpler
// flows are covered by the manual checklist in docs/dev/a11y-keyboard-checklist.md.
test('Transaction create row is completable by keyboard alone', async ({ page, pages }) => {
	const { accountName } = await seedBudget(pages);
	await pages.account.goto(accountName);

	// Open the inline create row from its trigger without a mouse.
	await page.getByRole('button', { name: 'New Transaction' }).focus();
	await page.keyboard.press('Enter');
	const createRow = page.getByRole('row', { name: 'New Transaction' });
	await expect(createRow).toBeVisible();

	// Reach the notes field by Tab and type into it — proving focus enters the row
	// and the field is keyboard-addressable.
	const notes = createRow.getByRole('textbox', { name: 'Notes' });
	await tabToFocus(page, notes);
	await page.keyboard.type('Keyboard entry');

	// The amount field is reachable by continuing to Tab forward.
	const amount = createRow.getByRole('textbox', { name: 'Amount' });
	await tabToFocus(page, amount);
	await page.keyboard.type('42');

	// Enter submits the row (submitWithKeyboard), completing the flow by keyboard.
	await page.keyboard.press('Enter');
	await expect(createRow).not.toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Edit notes' }).filter({ hasText: 'Keyboard entry' })
	).toBeVisible();
});
