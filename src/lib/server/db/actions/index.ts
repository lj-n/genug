import { createAccountActions } from './account';
import { createBudgetActions } from './budget';
import { createCategoryActions } from './category';
import { createTransactionActions } from './transaction';

export class Actions {
	account: ReturnType<typeof import('./account').createAccountActions>;
	budget: ReturnType<typeof import('./budget').createBudgetActions>;
	category: ReturnType<typeof import('./category').createCategoryActions>;
	transaction: ReturnType<typeof import('./transaction').createTransactionActions>;

	constructor({ database, user }: { database: App.Database; user: App.User }) {
		this.account = createAccountActions({ database, user });
		this.budget = createBudgetActions({ database, user });
		this.category = createCategoryActions({ database, user });
		this.transaction = createTransactionActions({ database, user });
	}
}

export { withPermissions } from './permissions';
