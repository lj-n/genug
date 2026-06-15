import { database } from '$db';

import * as account from './account';
import * as budget from './budget';
import * as category from './category';
import * as transaction from './transaction';

export const createUserCtx = (userId: string, db: App.Database = database) => ({
	account: {
		...account.commands(userId, db),
		...account.queries(userId, db)
	},
	budget: {
		...budget.commands(userId, db),
		...budget.queries(userId, db)
	},
	category: {
		...category.commands(userId, db),
		...category.queries(userId, db)
	},
	transaction: {
		...transaction.commands(userId, db),
		...transaction.queries(userId, db)
	}
});

export type UserCtx = ReturnType<typeof createUserCtx>;
