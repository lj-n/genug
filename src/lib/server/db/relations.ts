import { defineRelations } from 'drizzle-orm';

import * as tables from './tables';

export const relations = defineRelations(tables, (r) => ({
	accounts: {
		budget: r.one.budgets({
			from: r.accounts.budgetId,
			optional: false,
			to: r.budgets.id
		}),

		transactions: r.many.transactions({
			from: r.accounts.id,
			to: r.transactions.accountId
		})
	},

	apiTokens: {
		user: r.one.users({
			from: r.apiTokens.userId,
			optional: false,
			to: r.users.id
		})
	},

	budgets: {
		accounts: r.many.accounts({
			from: r.budgets.id,
			to: r.accounts.budgetId
		}),

		assignments: r.many.budgetAssignments({
			from: r.budgets.id,
			to: r.budgetAssignments.budgetId
		}),

		categories: r.many.categories({
			from: r.budgets.id,
			to: r.categories.budgetId
		}),

		invitees: r.many.usersToBudgets({
			from: r.budgets.id,
			to: r.usersToBudgets.budgetId,
			where: { role: 'INVITEE' }
		}),

		transactions: r.many.transactions({
			from: r.budgets.id,
			to: r.transactions.budgetId
		}),

		users: r.many.usersToBudgets({
			alias: 'usersWithAccess',
			from: r.budgets.id,
			to: r.usersToBudgets.budgetId,
			where: {
				role: { OR: ['OWNER', 'MEMBER'] }
			}
		})
	},

	categories: {
		assignments: r.many.budgetAssignments({
			from: r.categories.id,
			to: r.budgetAssignments.categoryId
		}),

		budget: r.one.budgets({
			from: r.categories.budgetId,
			optional: false,
			to: r.budgets.id
		}),

		transactions: r.many.transactions({
			from: r.categories.id,
			to: r.transactions.categoryId
		})
	},

	sessions: {
		user: r.one.users({
			from: r.sessions.userId,
			optional: false,
			to: r.users.id
		})
	},

	transactions: {
		account: r.one.accounts({
			from: r.transactions.accountId,
			optional: false,
			to: r.accounts.id
		}),

		budget: r.one.budgets({
			from: r.transactions.budgetId,
			optional: false,
			to: r.budgets.id
		}),

		category: r.one.categories({
			from: r.transactions.categoryId,
			to: r.categories.id
		})
	},

	users: {
		budgets: r.many.usersToBudgets({
			from: r.users.id,
			to: r.usersToBudgets.userId,
			where: {
				role: { OR: ['OWNER', 'MEMBER'] }
			}
		}),

		invitations: r.many.usersToBudgets({
			from: r.users.id,
			to: r.usersToBudgets.userId,
			where: { role: 'INVITEE' }
		})
	}
}));
