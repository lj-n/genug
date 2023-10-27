import { relations } from 'drizzle-orm';
import {
	user,
	teamMember,
	userAccount,
	userCategory,
	userTransaction,
	team,
	userBudget
} from './tables';

export const userRelations = relations(user, ({ many }) => ({
	teams: many(teamMember),
	categories: many(userCategory),
	accounts: many(userAccount),
	budgets: many(userBudget)
}));

export const teamRelations = relations(team, ({ many }) => ({
	members: many(teamMember)
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	})
}));

export const userTransactionRelations = relations(
	userTransaction,
	({ one }) => ({
		user: one(user, {
			fields: [userTransaction.userId],
			references: [user.id]
		}),
		category: one(userCategory, {
			fields: [userTransaction.categoryId],
			references: [userCategory.id]
		}),
		account: one(userAccount, {
			fields: [userTransaction.accountId],
			references: [userAccount.id]
		})
	})
);

export const userCategoryRelations = relations(
	userCategory,
	({ one, many }) => ({
		user: one(user, {
			fields: [userCategory.userId],
			references: [user.id]
		}),
		transactions: many(userTransaction)
	})
);

export const userAccountRelations = relations(userAccount, ({ one, many }) => ({
	user: one(user, {
		fields: [userAccount.userId],
		references: [user.id]
	}),
	transactions: many(userTransaction)
}));

export const userBudgetRelations = relations(userBudget, ({ one }) => ({
	user: one(user, {
		fields: [userBudget.userId],
		references: [user.id]
	}),
	category: one(userCategory, {
		fields: [userBudget.categoryId],
		references: [userCategory.id]
	})
}));
