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
		// vaul-svelte animates the drawer with CSS keyframes that don't respect
		// prefers-reduced-motion. Always wait for ALL animations to finish — even
		// when the drawer was already open (the previous action may have just
		// opened it and the slide-in animation is still running).
		// The drawer content is teleported to a portal *outside* the drawer root,
		// so we must check both the root and the content for running animations.
		await this.page.waitForFunction(() => {
			const noRunningAnimations = (el: Element | null) =>
				!el || el.getAnimations({ subtree: true }).every((a) => a.playState !== 'running');
			return (
				noRunningAnimations(document.querySelector('[data-vaul-drawer]')) &&
				noRunningAnimations(document.querySelector('[data-slot="drawer-content"]'))
			);
		});
	}

	#getViewportWidth() {
		return this.page.viewportSize()?.width ?? 1292;
	}
}
