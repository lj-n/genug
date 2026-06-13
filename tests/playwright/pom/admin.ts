import type { Page } from '@playwright/test';

import { BasePage } from './base-page';

export class AdminPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async resetDatabase() {
		await this.page.goto('/admin');
		this.page.on('dialog', (dialog) => dialog.accept());
		await this.page.getByRole('button', { name: 'Reset Instance' }).click();
		await this.page.waitForURL('/login/first');
	}
}
