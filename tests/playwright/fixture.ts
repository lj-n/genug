import { test as base } from '@playwright/test';

import { Pages } from './pom';

export * from '@playwright/test';

export const test = base.extend<{ pages: Pages }>({
	pages: async ({ page }, use) => {
		// Disable vaul-svelte drawer animations in tests.
		// This eliminates timing dependencies from the mobile navigation
		// drawer (slide-in, fade-out) which don't respect prefers-reduced-motion.
		// Targeted CSS avoids breaking floating-ui portal transitions
		// used by Select/Combobox components.
		await page.addInitScript(() => {
			const style = document.createElement('style');
			style.textContent = `[data-vaul-drawer],[data-vaul-drawer] *,[data-vaul-overlay],[data-vaul-overlay] *{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}`;
			document.head.appendChild(style);
		});

		await use(new Pages(page));
	}
});
