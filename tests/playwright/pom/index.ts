import type { Page } from '@playwright/test';

import { AccountPage } from './account';
import { AdminPage } from './admin';
import { AuthPage } from './auth';
import { type TestContext } from './base-page';
import { BudgetPage } from './budget';
import { CategoryPage } from './category';
import { SettingsPage } from './settings';

export class Pages {
	account: AccountPage;
	admin: AdminPage;
	auth: AuthPage;
	budget: BudgetPage;
	category: CategoryPage;
	settings: SettingsPage;

	constructor(page: Page) {
		const ctx: TestContext = { accounts: new Map() };

		this.account = new AccountPage(page, ctx);
		this.admin = new AdminPage(page, ctx);
		this.auth = new AuthPage(page, ctx);
		this.budget = new BudgetPage(page, ctx);
		this.category = new CategoryPage(page, ctx);
		this.settings = new SettingsPage(page, ctx);
	}
}
