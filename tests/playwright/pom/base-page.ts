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
		if (await signOutButton.isVisible()) return; // Already open
		await this.page.getByRole('button', { name: 'Toggle Navigation' }).click();
		await expect(signOutButton).toBeVisible();
	}

	#getViewportWidth() {
		return this.page.viewportSize()?.width ?? 1292;
	}
}
