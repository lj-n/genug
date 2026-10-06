import { test as base, expect, type Page } from '@playwright/test';

import { Pages } from './pom';

export * from '@playwright/test';

/**
 * Waits until the client app on `page` has hydrated, so the next interaction
 * reaches the app's handlers.
 *
 * A click that lands in the paint→hydration window is swallowed by
 * client-only controls (menus, dialogs), and a submit bypasses the remote
 * form's `enhance` callback and posts natively: the server still runs the
 * action, but client-only `onSuccess` effects (e.g. revealing a dialog)
 * never happen. SvelteKit's root component mounts its `#svelte-announcer`
 * live region only once hydration completes (also on `+error.svelte` pages),
 * so its presence is the signal.
 *
 * The `page` fixture already calls this after `goto`/`reload`/`goBack`/
 * `goForward`. Call it yourself after an action that triggers a full page
 * load, such as a native form post.
 */
export async function waitForHydration(page: Page) {
	await expect(page.locator('#svelte-announcer')).toBeAttached();
}

function hydrated<A extends unknown[], R>(page: Page, navigate: (...args: A) => Promise<R>) {
	return async (...args: A) => {
		const response = await navigate(...args);
		await waitForHydration(page);
		return response;
	};
}

export const test = base.extend<{ hydrationGuard: boolean; pages: Pages }>({
	// Opt out with `test.use({ hydrationGuard: false })` plus a one-line
	// reason, only for tests that must act before hydration.
	hydrationGuard: [true, { option: true }],

	page: async ({ hydrationGuard, javaScriptEnabled, page }, use) => {
		// Opt-in: E2E_REMOTE_DELAY=<ms> holds every remote-function request to
		// widen race windows while diagnosing flakes. Never set in CI.
		const remoteDelay = Number(process.env.E2E_REMOTE_DELAY ?? 0);
		if (remoteDelay > 0) {
			await page.route('**/_app/remote/**', async (route) => {
				await new Promise((resolve) => setTimeout(resolve, remoteDelay));
				await route.fallback();
			});
		}

		// Without JS the app never hydrates, so there is nothing to wait for.
		if (javaScriptEnabled && hydrationGuard) {
			page.goto = hydrated(page, page.goto.bind(page));
			page.reload = hydrated(page, page.reload.bind(page));
			page.goBack = hydrated(page, page.goBack.bind(page));
			page.goForward = hydrated(page, page.goForward.bind(page));
		}

		await use(page);
	},

	pages: async ({ page }, use) => {
		// Disable vaul-svelte drawer animations in tests.
		// This eliminates timing dependencies from the mobile navigation
		// drawer (slide-in, fade-out) which don't respect prefers-reduced-motion.
		// Targeted CSS avoids breaking floating-ui portal transitions
		// used by Select/Combobox components.
		await page.addInitScript(() => {
			const style = document.createElement('style');
			// Wrapped in a cascade layer and prepended to <head> so it is the first
			// declared layer: for !important declarations the earliest layer wins,
			// which beats Tailwind's layered utilities such as `!duration-300` on
			// the drawer content (an unlayered !important rule would lose to them).
			style.textContent = `@layer e2e-overrides{[data-vaul-drawer],[data-vaul-drawer] *,[data-vaul-overlay],[data-vaul-overlay] *{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}}`;
			// Init scripts run before the document is parsed, so <head> may not
			// exist yet; add the style once it does.
			const append = () => document.head.prepend(style);
			if (document.head) append();
			else document.addEventListener('DOMContentLoaded', append, { once: true });
		});

		await use(new Pages(page));
	}
});
