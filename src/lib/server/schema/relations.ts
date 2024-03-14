import { relations } from 'drizzle-orm';
import {
	user,
	teamMember,
	team,
	userSettings,
	userAvatar,
	account,
	category,
	transaction,
	budget
} from './tables';

export const userRelations = relations(user, ({ many, one }) => ({
	profile: one(userSettings, {
		fields: [user.id],
		references: [userSettings.userId]
	}),
	avatar: one(userAvatar, {
		fields: [user.id],
		references: [userAvatar.userId]
	}),
	teams: many(teamMember),
	accounts: many(account),
	categories: many(category),
	transactions: many(transaction),
	budgets: many(budget)
}));

export const accountRelations = relations(account, ({ one, many }) => ({
	creator: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [account.teamId],
		references: [team.id]
	}),
	transactions: many(transaction)
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
	creator: one(user, {
		fields: [category.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [category.teamId],
		references: [team.id]
	}),
	transactions: many(transaction)
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
	creator: one(user, {
		fields: [transaction.userId],
		references: [user.id]
	}),
	category: one(category, {
		fields: [transaction.categoryId],
		references: [category.id]
	}),
	account: one(account, {
		fields: [transaction.accountId],
		references: [account.id]
	})
}));

export const budgetRelations = relations(budget, ({ one }) => ({
	creator: one(user, {
		fields: [budget.userId],
		references: [user.id]
	}),
	category: one(category, {
		fields: [budget.categoryId],
		references: [category.id]
	})
}));

export const teamRelations = relations(team, ({ many }) => ({
	members: many(teamMember),
	accounts: many(account),
	categories: many(category),
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
