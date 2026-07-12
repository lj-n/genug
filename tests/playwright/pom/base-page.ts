import { expect, type Page } from '@playwright/test';

/**
 * State shared across page objects within a single test.
 *
 * Navigation in the app happens through the mobile drawer (tablet) or the
 * sidebar (desktop). Driving navigation by clicking those links is flaky on
 * slow CI runners: the drawer animates open and the nav lists load
 * asynchronously, so a link's position keeps shifting and never satisfies
 * Playwright's "stable" actionability check.
 *
 * Instead we capture the canonical URL of each entity when it is created and
 * navigate to it directly with `page.goto`. This keeps the "arrange" phase of
 * every test deterministic and fast. The drawer itself is still exercised by
 * the login/signout flow.
 */
export type TestContext = {
	/** account name -> account page URL */
	accounts: Map<string, string>;
	/** the current budget's id (captured after createBudget) */
	budgetId?: string;
	/** the current budget's page URL (captured after createBudget) */
	budgetUrl?: string;
};

export class BasePage {
	readonly ctx: TestContext;
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

	constructor(page: Page, ctx: TestContext) {
		this.page = page;
		this.ctx = ctx;
	}

	async openMobileNavigation() {
		const signOutButton = this.page.getByRole('button', { name: 'Sign out' });
		if (!(await signOutButton.isVisible())) {
			await this.page.getByRole('button', { name: 'Toggle Navigation' }).click();
			await expect(signOutButton).toBeVisible();
		}
	}

	#getViewportWidth() {
		return this.page.viewportSize()?.width ?? 1292;
	}
}
