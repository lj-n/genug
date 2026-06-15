import { database } from '$db';

import * as budget from './budget';

export const createUserCtx = (userId: string, db: App.Database = database) => ({
	budget: {
		...budget.commands(userId, db),
		...budget.queries(userId, db)
	}
});

export type UserCtx = ReturnType<typeof createUserCtx>;
