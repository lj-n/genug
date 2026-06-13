import type { Page } from '@playwright/test';

import { AdminPage } from './admin';
import { AuthPage } from './auth';

export class Pages {
	admin: AdminPage;
	auth: AuthPage;

	constructor(page: Page) {
		this.auth = new AuthPage(page);
		this.admin = new AdminPage(page);
	}
}
