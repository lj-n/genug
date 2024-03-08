import { relations } from 'drizzle-orm';
import {
	user,
	teamMember,
	userAccount,
	userCategory,
	userTransaction,
	team,
	userBudget,
	teamAccount,
	teamCategory,
	teamTransaction,
	teamBudget,
	userSettings,
	userAvatar
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
	accounts: many(userAccount),
	categories: many(userCategory),
	transactions: many(userTransaction),
	budgets: many(userBudget)
}));

export const userAccountRelations = relations(userAccount, ({ one, many }) => ({
	user: one(user, {
		fields: [userAccount.userId],
		references: [user.id]
	}),
	transactions: many(userTransaction)
}));

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

export const teamRelations = relations(team, ({ many }) => ({
	members: many(teamMember),
	accounts: many(teamAccount),
	categories: many(teamCategory),
	transactions: many(teamTransaction),
	budgets: many(teamBudget)
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

export const teamAccountRelations = relations(teamAccount, ({ one, many }) => ({
	team: one(team, {
		fields: [teamAccount.teamId],
		references: [team.id]
	}),
	createdBy: one(user, {
		fields: [teamAccount.createdBy],
		references: [user.id]
	}),
	transactions: many(teamTransaction)
}));

export const teamCategoryRelations = relations(
	teamCategory,
	({ one, many }) => ({
		team: one(team, {
			fields: [teamCategory.teamId],
			references: [team.id]
		}),
		createdBy: one(user, {
			fields: [teamCategory.createdBy],
			references: [user.id]
		}),
		budgets: many(teamBudget),
		transactions: many(teamTransaction)
	})
);

export const teamTransactionRelations = relations(
	teamTransaction,
	({ one }) => ({
		team: one(team, {
			fields: [teamTransaction.teamId],
			references: [team.id]
		}),
		category: one(teamCategory, {
			fields: [teamTransaction.categoryId],
			references: [teamCategory.id]
		}),
		account: one(teamAccount, {
			fields: [teamTransaction.accountId],
			references: [teamAccount.id]
		}),
		createdBy: one(user, {
			fields: [teamTransaction.createdBy],
			references: [user.id]
		})
	})
);

export const teamBudgetRelations = relations(teamBudget, ({ one }) => ({
	team: one(team, {
		fields: [teamBudget.teamId],
		references: [team.id]
	}),
	category: one(teamCategory, {
		fields: [teamBudget.categoryId],
		references: [teamCategory.id]
	}),
	setBy: one(user, {
		fields: [teamBudget.setBy],
		references: [user.id]
	})
}));
