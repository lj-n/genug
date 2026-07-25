import { faker } from '@faker-js/faker';

import type { Pages } from './pom';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

/**
 * The category detail surface splits by viewport, carried entirely by the
 * budget table's desktop-cells/mobile-card markup split (no runtime viewport
 * detection): at @3xl/main and up the name cell anchors a monthly-stats
 * popover with a Settings link to the detail page; below that, the card's
 * name is a plain link straight to the page.
 *
 * Seeding runs at the project's default desktop viewport (the POM navigation
 * assumes a desktop/tablet layout); the narrow case only shrinks the viewport
 * right before following the name link, which is all the markup split reads.
 */
async function seedCategory(pages: Pages) {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	await pages.budget.createAccount(uniqueName(faker.finance.accountName()));

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
	return categoryName;
}

test('Category name cell opens the monthly-stats popover on wide viewports', async ({ pages }) => {
	const categoryName = await seedCategory(pages);

	await pages.category.openPopover(categoryName);

	const popover = pages.category.popover();
	// The popover stays within the viewport, so the Settings link never renders
	// off screen.
	await expect(popover).toBeInViewport();

	// The popover's heading repeats the category name (the panel opens over the
	// name cell); the viewed month — what the stats are scoped to — sits beside
	// it in short form. Plus the Settings link and the monthly stats body.
	await expect(popover.getByRole('heading', { name: categoryName })).toBeVisible();
	const monthLabel = new Intl.DateTimeFormat('en', {
		month: 'short',
		year: 'numeric'
	}).format(new Date());
	// exact: the sparkline's SVG <title> also contains the month ("Jul 2026: €…").
	await expect(popover.getByText(monthLabel, { exact: true })).toBeVisible();
	await expect(popover.getByRole('link', { name: 'Settings' })).toBeVisible();
	await expect(popover.getByText('Average Monthly Spend')).toBeVisible();
});

test('Category popover reopens for the same category after closing', async ({ page, pages }) => {
	const categoryName = await seedCategory(pages);

	await pages.category.openPopover(categoryName);

	await page.keyboard.press('Escape');
	await expect(pages.category.popover()).toHaveCount(0);

	await pages.category.openPopover(categoryName);
});

test('Category name navigates to the detail page on narrow viewports', async ({ page, pages }) => {
	const categoryName = await seedCategory(pages);

	await page.setViewportSize({ height: 720, width: 390 });

	// The mobile card's name is a plain link — no popover in between.
	await page
		.getByRole('row')
		.filter({ hasText: categoryName })
		.getByRole('link', { exact: true, name: categoryName })
		.click();

	await expect(page).toHaveURL(/\/categories\/[^/]+$/);
	await expect(page.getByRole('heading', { name: categoryName })).toBeVisible();
	await expect(pages.category.popover()).toHaveCount(0);
});
