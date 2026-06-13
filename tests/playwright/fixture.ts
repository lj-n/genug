import { test as base } from '@playwright/test';

import { Pages } from './pom';

export * from '@playwright/test';

export const test = base.extend<{ pages: Pages }>({
	pages: async ({ page }, use) => {
		await use(new Pages(page));
	}
});
