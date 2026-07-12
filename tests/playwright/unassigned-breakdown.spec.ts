import { asMoney, formatMoney } from '$lib/utils/money';
import { addMonths, formatMonth, type Month, parseMonth, toParam } from '$lib/utils/month';
import { faker } from '@faker-js/faker';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

// #73: the Unassigned pill opens a popover that decomposes the viewed month's
// value — income and assignments up to the month, Position, Reserved with the
// Bottleneck month as a link — ending in exactly the pill's number and label.
test('Unassigned pill explains its value and links the Bottleneck month (#73)', async ({
	page,
	pages
}) => {
	await pages.auth.createUserAndLogin();

	const budgetName = faker.commerce.department();
	await pages.budget.createBudget(budgetName);

	// €5.00 income, dated today → the current month.
	const accountName = uniqueName(faker.finance.accountName());
	await pages.budget.createAccount(accountName, '5');

	await pages.budget.goto(budgetName);
	await pages.budget.createCategory('Rent');

	const url = new URL(page.url());
	const [, budgetId, currentParam] = url.pathname.split('/');
	const current = parseMonth(currentParam)!;
	const next = addMonths(current, 1);
	const monthUrl = (m: Month) => `${url.origin}/${budgetId}/${toParam(m)}`;

	// Assign €3.00 in the NEXT month. No income arrives there, so next month's
	// position (5 − 3 = 2) pins the current month: Unassigned = €2.00 with
	// €3.00 Reserved and next month as the Bottleneck.
	await page.goto(monthUrl(next));
	await pages.budget.assignAmount('Rent', '3');

	const money = (cents: number, signed = false) =>
		formatMoney({
			currency: 'EUR',
			money: asMoney(cents),
			options: signed ? { signDisplay: 'always' } : undefined
		});
	const longMonth = (m: Month) =>
		formatMonth({ locale: 'en', month: m, options: { month: 'long', year: 'numeric' } });
	const shortMonth = (m: Month) =>
		formatMonth({ locale: 'en', month: m, options: { month: 'short', year: '2-digit' } });

	const pill = page.getByRole('button', { name: 'Explain the unallocated amount' });
	// bits-ui popover content carries no dialog role; target its slot marker.
	const popover = page.locator('[data-slot="popover-content"]');
	const row = (label: string, exact = false) =>
		popover.locator('dl > div').filter({ has: page.getByText(label, { exact }) });

	// Current month: constrained by the Bottleneck — all five rows appear.
	await page.goto(monthUrl(current));
	await expect(pill).toContainText(money(200));
	await pill.click();

	await expect(row(`Income through ${longMonth(current)}`)).toContainText(money(500, true));
	await expect(row(`Allocated through ${longMonth(current)}`)).toContainText(money(0, true));
	await expect(row('Position', true)).toContainText(money(500, true));
	await expect(row('Reserved')).toContainText(`Bottleneck: ${shortMonth(next)}`);
	await expect(row('Reserved')).toContainText(money(-300, true));
	await expect(row('Unallocated', true)).toContainText(money(200));

	// The Bottleneck link walks to the pinning month, closing the popover;
	// the same number reappears on that month's pill.
	await popover.getByRole('link', { name: `Go to ${longMonth(next)}` }).click();
	await expect(page).toHaveURL(monthUrl(next));
	await expect(popover).not.toBeVisible();
	await expect(pill).toContainText(money(200));

	// Bottleneck month: it is itself the minimum, so nothing is Reserved —
	// income minus assignments collapses straight into the final row.
	await pill.click();
	await expect(row(`Income through ${longMonth(next)}`)).toContainText(money(500, true));
	await expect(row(`Allocated through ${longMonth(next)}`)).toContainText(money(-300, true));
	await expect(row('Unallocated', true)).toContainText(money(200));
	await expect(popover.getByText('Reserved')).toHaveCount(0);
	await expect(popover.getByText('Position', { exact: true })).toHaveCount(0);
});
