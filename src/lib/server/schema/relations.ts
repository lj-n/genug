import { relations } from 'drizzle-orm';
import {
	user,
	teamMember,
	userAccount,
	userCategory,
	userTransaction,
	team
} from './tables';

export const userRelations = relations(user, ({ many }) => ({
	teams: many(teamMember),
	categories: many(userCategory),
	accounts: many(userAccount)
}));

export const teamRelations = relations(team, ({ many }) => ({
	member: many(teamMember)
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
