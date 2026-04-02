import { createAccountActions } from './account';
import { createBudgetActions } from './budget';

export class Actions {
	account: ReturnType<typeof import('./account').createAccountActions>;
	budget: ReturnType<typeof import('./budget').createBudgetActions>;

	constructor({ database, user }: { database: App.Database; user: App.User }) {
		this.account = createAccountActions({ database, user });
		this.budget = createBudgetActions({ database, user });
	}
}

export { withPermissions } from './permissions';
