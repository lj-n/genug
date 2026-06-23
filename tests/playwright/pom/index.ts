import type { Page } from '@playwright/test';

import { AccountPage } from './account';
import { AdminPage } from './admin';
import { AuthPage } from './auth';
import { BudgetPage } from './budget';
import { CategoryPage } from './category';

export class Pages {
	account: AccountPage;
	admin: AdminPage;
	auth: AuthPage;
	budget: BudgetPage;
	category: CategoryPage;

	constructor(page: Page) {
		this.account = new AccountPage(page);
		this.admin = new AdminPage(page);
		this.auth = new AuthPage(page);
		this.budget = new BudgetPage(page);
		this.category = new CategoryPage(page);
	}
}
