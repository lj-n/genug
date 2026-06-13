import { tables } from '$db';

import type { Database } from './create-database';

export function deleteDatabase(db: Database) {
	db.transaction((tx) => {
		tx.delete(tables.transactions).run();
		tx.delete(tables.accounts).run();
		tx.delete(tables.categories).run();
		tx.delete(tables.budgets).run();
		tx.delete(tables.users).run();
		tx.delete(tables.sessions).run();
		tx.delete(tables.budgetAssignments).run();
		tx.delete(tables.userEntityOrder).run();
		tx.delete(tables.usersToBudgets).run();
	});
}
