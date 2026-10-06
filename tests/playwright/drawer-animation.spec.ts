import { expect, test } from './fixture';

/**
 * Guards the vaul drawer-animation override injected by the `pages` fixture
 * (`fixture.ts`). The override's <style> must land in <head>: an init script
 * that appends it before <head> exists leaves every drawer test running with
 * real animations. The drawer content sets its own `transition-duration`, so a
 * missing override shows up as a non-zero computed duration.
 */
test('Drawer animations are disabled in tests', async ({ page, pages }) => {
	await page.setViewportSize({ height: 667, width: 375 });
	await pages.auth.createUserAndLogin();
	await pages.auth.openMobileNavigation();

	const drawer = page.locator('[data-vaul-drawer]');
	await expect(drawer).toBeVisible();

	const overrideInHead = await page.evaluate(() =>
		[...document.head.querySelectorAll('style')].some((style) =>
			style.textContent?.includes('[data-vaul-drawer]')
		)
	);
	expect(overrideInHead).toBe(true);
	await expect(drawer).toHaveCSS('transition-duration', '0s');
});
