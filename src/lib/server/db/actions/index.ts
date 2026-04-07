import { createAccountActions } from './account';
import { createBudgetActions } from './budget';
import { createCategoryActions } from './category';

export class Actions {
	account: ReturnType<typeof import('./account').createAccountActions>;
	budget: ReturnType<typeof import('./budget').createBudgetActions>;
	category: ReturnType<typeof import('./category').createCategoryActions>;

	constructor({ database, user }: { database: App.Database; user: App.User }) {
		this.account = createAccountActions({ database, user });
		this.budget = createBudgetActions({ database, user });
		this.category = createCategoryActions({ database, user });
	}
}

export { withPermissions } from './permissions';
