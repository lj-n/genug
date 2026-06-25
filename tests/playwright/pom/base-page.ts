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
		// vaul-svelte animates the drawer with CSS keyframes that don't respect
		// prefers-reduced-motion. Wait for the slide-in animation to finish so
		// that elements inside are stable before we try to click them.
		await this.page.waitForFunction(() => {
			const drawer = document.querySelector('[data-vaul-drawer]');
			return (
				!drawer || drawer.getAnimations({ subtree: true }).every((a) => a.playState !== 'running')
			);
		});
	}

	#getViewportWidth() {
		return this.page.viewportSize()?.width ?? 1292;
	}
}
