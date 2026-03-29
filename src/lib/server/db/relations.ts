import { defineRelations } from "drizzle-orm";
import * as tables from "./tables";

export const relations = defineRelations(tables, (r) => ({
    sessions: {
        user: r.one.users({
            from: r.sessions.userId,
            to: r.users.id,
            optional: false,
        }),
    },

    users: {
        budgets: r.many.usersToBudgets({
            from: r.users.id,
            to: r.usersToBudgets.userId,
            where: {
                role: { OR: ["OWNER", "MEMBER"] },
            },
        }),

        invitations: r.many.usersToBudgets({
            from: r.users.id,
            to: r.usersToBudgets.userId,
            where: { role: "INVITEE" },
        }),
    },

    budgets: {
        users: r.many.usersToBudgets({
            from: r.budgets.id,
            to: r.usersToBudgets.budgetId,
            where: {
                role: { OR: ["OWNER", "MEMBER"] },
            },
            alias: "usersWithAccess",
        }),

        invitees: r.many.usersToBudgets({
            from: r.budgets.id,
            to: r.usersToBudgets.budgetId,
            where: { role: "INVITEE" },
        }),

        accounts: r.many.accounts({
            from: r.budgets.id,
            to: r.accounts.budgetId,
        }),

        categories: r.many.categories({
            from: r.budgets.id,
            to: r.categories.budgetId,
        }),

        transactions: r.many.transactions({
            from: r.budgets.id,
            to: r.transactions.budgetId,
        }),

        assignments: r.many.budgetAssignments({
            from: r.budgets.id,
            to: r.budgetAssignments.budgetId,
        }),
    },

    accounts: {
        budget: r.one.budgets({
            from: r.accounts.budgetId,
            to: r.budgets.id,
            optional: false,
        }),

        transactions: r.many.transactions({
            from: r.accounts.id,
            to: r.transactions.accountId,
        }),
    },

    categories: {
        budget: r.one.budgets({
            from: r.categories.budgetId,
            to: r.budgets.id,
            optional: false,
        }),

        transactions: r.many.transactions({
            from: r.categories.id,
            to: r.transactions.categoryId,
        }),

        assignments: r.many.budgetAssignments({
            from: r.categories.id,
            to: r.budgetAssignments.categoryId,
        }),
    },

    transactions: {
        budget: r.one.budgets({
            from: r.transactions.budgetId,
            to: r.budgets.id,
            optional: false,
        }),

        account: r.one.accounts({
            from: r.transactions.accountId,
            to: r.accounts.id,
            optional: false,
        }),

        category: r.one.categories({
            from: r.transactions.categoryId,
            to: r.categories.id,
        }),
    },
}));
