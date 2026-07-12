import { asMoney, formatMoney } from '$lib/utils/money';
import { addMonths, type Month, parseMonth, toParam } from '$lib/utils/month';
import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

// Regression for #44: Unassigned is month-scoped. A starting balance is an
// income transaction dated the current month; on any earlier month it must not
// count (income ≤ viewed month), so those pages read zero — not the income.
test('Unassigned does not leak current-month income into earlier months (#44)', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	// €5.00 income, dated today → the current month.
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName, '5');

	// Back on the budget page; capture budgetId + current month from the URL.
	await pages.budget.goto(budgetName);
	const url = new URL(page.url());
	const [, budgetId, currentParam] = url.pathname.split('/');
	const current = parseMonth(currentParam)!;
	const prev = addMonths(current, -1);
	const next = addMonths(current, 1);
	const monthUrl = (m: Month) => `${url.origin}/${budgetId}/${toParam(m)}`;

	const five = formatMoney({ currency: 'EUR', money: asMoney(500) });

	// Current month: the €5.00 is available and unassigned.
	await page.goto(monthUrl(current));
	await expect(page.getByText('Unallocated:')).toBeVisible();
	await expect(page.getByText(five)).toBeVisible();

	// Previous month: income is dated the current month, so it is not yet
	// present here — Unassigned is zero ("All done."), not €5.00.
	await page.goto(monthUrl(prev));
	await expect(page.getByText('All done.')).toBeVisible();
	await expect(page.getByText(five)).toHaveCount(0);

	// Next month: the income is available (income ≤ next), so €5.00 again.
	await page.goto(monthUrl(next));
	await expect(page.getByText('Unallocated:')).toBeVisible();
	await expect(page.getByText(five)).toBeVisible();
});

// The exact scenario from the #44 review: an income transaction dated in a
// FUTURE month (here current + 2). It must count only from that month onward —
// never on the current month, and never on earlier months.
test('Unassigned counts a future-dated income only from its month onward (#44)', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	const url = new URL(page.url());
	const [, budgetId, currentParam] = url.pathname.split('/');
	const current = parseMonth(currentParam)!;
	const monthUrl = (m: Month) => `${url.origin}/${budgetId}/${toParam(m)}`;

	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName);
	await pages.account.goto(accountName);

	// New income transaction (no category) dated two months in the future.
	await page.getByRole('button', { name: 'New Transaction' }).click();
	const createRow = page.getByRole('row', { name: 'New Transaction' });
	// The date picker defaults to today, so its accessible name is today's date,
	// not the "Select date" placeholder — target the popover-trigger button.
	await createRow.locator('button[aria-haspopup="dialog"]').click();
	const nextMonth = page.locator('[data-calendar-next-button]');
	await nextMonth.click();
	await nextMonth.click();
	await page.locator('[data-calendar-day]:not([data-outside-month])', { hasText: /^15$/ }).click();
	await createRow.getByRole('textbox', { name: 'Amount' }).fill('5');
	await createRow.getByRole('button', { exact: true, name: 'Save' }).click();
	await expect(createRow).toBeHidden();

	const incomeMonth = addMonths(current, 2);
	const five = formatMoney({ currency: 'EUR', money: asMoney(500) });

	// Earlier month, current month, and the month right before the income month:
	// the money is not present yet, so Unassigned is zero.
	for (const m of [addMonths(current, -1), current, addMonths(current, 1)]) {
		await page.goto(monthUrl(m));
		await expect(page.getByText('All done.')).toBeVisible();
		await expect(page.getByText(five)).toHaveCount(0);
	}

	// The income month and the one after it: €5.00 is available and unassigned.
	for (const m of [incomeMonth, addMonths(incomeMonth, 1)]) {
		await page.goto(monthUrl(m));
		await expect(page.getByText('Unallocated:')).toBeVisible();
		await expect(page.getByText(five)).toBeVisible();
	}
});
