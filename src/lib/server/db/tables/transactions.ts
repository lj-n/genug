import { foreignKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { createId } from "../../utils/create-id";
import { users } from "./users";
import { accounts } from "./accounts";
import { categories } from "./categories";
import { budgets } from "./budgets";

export const transactions = sqliteTable(
    "transactions",
    (t) => ({
        id: t.text("id").primaryKey().$defaultFn(() => createId()),
        createdAt: t.integer("created_at", { mode: "timestamp" })
            .$defaultFn(() => new Date()).notNull(),
        createdBy: t.text("created_by")
            .references(() => users.id, { onDelete: "set null" }),
        amount: t.integer("amount", { mode: "number" }).notNull(),
        date: t.integer("date", { mode: "timestamp" }).notNull(),
        notes: t.text("notes"),
        budgetId: t.text("budget_id")
            .references(() => budgets.id, { onDelete: "cascade" })
            .notNull(),
        accountId: t.text("account_id")
            .references(() => accounts.id, { onDelete: "cascade" })
            .notNull(),
        categoryId: t.text("category_id")
            .references(() => categories.id, { onDelete: "set null" }),
        validated: t.integer("validated", { mode: "boolean" }).default(false)
            .notNull(),
    }),
    (t) => [
        foreignKey({
            columns: [t.accountId, t.budgetId],
            foreignColumns: [accounts.id, accounts.budgetId],
        }),
        foreignKey({
            columns: [t.categoryId, t.budgetId],
            foreignColumns: [categories.id, categories.budgetId],
        }),
    ],
);

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    const { createDatabase } = await import("../create-database");

    it("transactions - foreign key constraints", async () => {
        const database = createDatabase(":memory:");

        const [budget] = await database
            .insert(budgets)
            .values({
                name: "Budget 1",
            })
            .returning();

        const [account] = await database
            .insert(accounts)
            .values({
                name: "Account 1",
                budgetId: budget.id,
            })
            .returning();

        const [category] = await database
            .insert(categories)
            .values({
                name: "Category 1",
                budgetId: budget.id,
            })
            .returning();

        await expect(
            database.insert(transactions).values({
                amount: 1000,
                date: new Date(),
                budgetId: budget.id,
                accountId: "nonexistent_account", // invalid accountId
                categoryId: category.id,
            }),
        ).rejects.toThrow();

        await expect(
            database.insert(transactions).values({
                amount: 1000,
                date: new Date(),
                budgetId: budget.id,
                accountId: account.id,
                categoryId: "nonexistent_category", // invalid categoryId
            }),
        ).rejects.toThrow();

        const [secondBudget] = await database
            .insert(budgets)
            .values({
                name: "Budget 2",
            })
            .returning();

        await expect(
            database.insert(transactions).values({
                amount: 1000,
                date: new Date(),
                budgetId: secondBudget.id, // mismatched budgetId - accountId
                accountId: account.id,
                categoryId: category.id,
            }),
        ).rejects.toThrow();
    });
}
