import { faker } from '@faker-js/faker';

import type { Pages } from './pom';

import { expect, test } from './fixture';
import { uniqueName } from './unique-name';

/**
 * The category detail surface uses the responsive modal shell: a Dialog at
 * >=640px and a bottom Drawer below.
 *
 * Seeding runs at the project's default desktop viewport (the POM navigation
 * assumes a desktop/tablet layout); the narrow case only shrinks the viewport
 * right before opening the detail, which is all the shell's media query reads.
 */
async function seedCategory(pages: Pages) {
	await pages.auth.createUserAndLogin();
	await pages.budget.createBudget(faker.commerce.department());
	await pages.budget.createAccount(uniqueName(faker.finance.accountName()));

	const categoryName = uniqueName(faker.commerce.department());
	await pages.budget.createCategory(categoryName);
	return categoryName;
}

test('Category detail opens as a dialog on wide viewports', async ({ page, pages }) => {
	const categoryName = await seedCategory(pages);

	await pages.category.openDetail(categoryName);

	await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
	await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(0);
});

test('Category detail reopens for the same category after closing', async ({ page, pages }) => {
	const categoryName = await seedCategory(pages);

	await pages.category.openDetail(categoryName);
	const dialog = page.locator('[data-slot="dialog-content"]');
	await expect(dialog).toBeVisible();

	// Close, then click the exact same category again. Because open state and the
	// selected id used to be the same derived value, reopening the same id was a
	// no-op — the dialog stayed shut until a different category was picked.
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);

	await pages.category.openDetail(categoryName);
	await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
});

test('Category detail opens as a bottom drawer on narrow viewports', async ({ page, pages }) => {
	const categoryName = await seedCategory(pages);

	await page.setViewportSize({ height: 720, width: 390 });
	await pages.category.openDetail(categoryName);

	const drawer = page.locator('[data-slot="drawer-content"]');
	await expect(drawer).toBeVisible();
	await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
	await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);

	// Escape dismisses the drawer, and the onOpenChangeComplete -> onAnimationEnd
	// bridge must reset state so the same category can be reopened. The press is
	// retried: the drawer paints one tick before bits-ui attaches its Escape
	// listener — a window no user can hit, but chromium-speed automation can.
	await expect(async () => {
		await page.keyboard.press('Escape');
		await expect(drawer).toHaveCount(0, { timeout: 1000 });
	}).toPass();
	await pages.category.openDetail(categoryName);
	await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible();
});
