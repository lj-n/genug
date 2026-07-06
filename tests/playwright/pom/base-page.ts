import { expect, type Page } from '@playwright/test';

export class BasePage {
	readonly page: Page;

	get isDesktop() {
		return this.#getViewportWidth() >= 1292;
	}

	get isMobile() {
		return this.#getViewportWidth() <= 767;
	}

	get isTablet() {
		return !this.isDesktop && !this.isMobile;
	}

	constructor(page: Page) {
		this.page = page;
	}

	async openMobileNavigation() {
		const signOutButton = this.page.getByRole('button', { name: 'Sign out' });
		if (!(await signOutButton.isVisible())) {
			await this.page.getByRole('button', { name: 'Toggle Navigation' }).click();
			await expect(signOutButton).toBeVisible();
		}
		// vaul-svelte animates the drawer with CSS keyframes (0.5s)
		// that don't respect prefers-reduced-motion. Always pause for
		// the slide-in to finish — even when the drawer was already open.
		// A fixed timeout is crude but more reliable than getAnimations()
		// which behaves inconsistently across browser versions in CI.
		await this.page.waitForTimeout(600);
	}

	#getViewportWidth() {
		return this.page.viewportSize()?.width ?? 1292;
	}
}
