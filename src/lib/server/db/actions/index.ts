import { createAccountActions } from './account';
import { createAdminActions } from './admin';
import { createBudgetActions } from './budget';
import { createCategoryActions } from './category';
import { createTransactionActions } from './transaction';

export class Actions {
	account: ReturnType<typeof createAccountActions>;
	budget: ReturnType<typeof createBudgetActions>;
	category: ReturnType<typeof createCategoryActions>;
	transaction: ReturnType<typeof createTransactionActions>;

	constructor({ database, user }: { database: App.Database; user: App.User }) {
		this.account = createAccountActions({ database, user });
		this.budget = createBudgetActions({ database, user });
		this.category = createCategoryActions({ database, user });
		this.transaction = createTransactionActions({ database, user });
	}
}

export class AdminActions extends Actions {
	admin: ReturnType<typeof createAdminActions>;

	constructor({ database, user }: { database: App.Database; user: App.User }) {
		super({ database, user });
		this.admin = createAdminActions({ database, user });
	}
}

export { withAdminPermissions, withPermissions } from './permissions';
