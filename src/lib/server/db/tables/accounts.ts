import { createId } from "../../utils/create-id";
import { sqliteTable, unique, uniqueIndex } from "drizzle-orm/sqlite-core";
import { budgets } from "./budgets";

export const accounts = sqliteTable(
    "accounts",
    (t) => ({
        id: t
            .text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        createdAt: t
            .integer("created_at", { mode: "timestamp" })
            .$defaultFn(() => new Date())
            .notNull(),
        name: t.text("name").notNull(),
        notes: t.text("notes"),
        budgetId: t
            .text("budget_id")
            .references(() => budgets.id, { onDelete: "cascade" })
            .notNull(),
    }),
    (t) => [
        uniqueIndex("account_budget_unique").on(t.id, t.budgetId),
        unique("account_name_budget_unique").on(t.name, t.budgetId),
    ],
);

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    const { createDatabase } = await import("../create-database");

    it("accounts - unique constraints", async () => {
        const database = createDatabase(":memory:");

        const [budget] = await database
            .insert(budgets)
            .values({
                id: "budget1",
                name: "Budget 1",
            })
            .returning();

        await database.insert(accounts).values({
            id: "account1",
            name: "Account 1",
            budgetId: budget.id,
        });

        await expect(
            database.insert(accounts).values({
                id: "account2",
                name: "Account 1", // same name
                budgetId: budget.id,
            }),
        ).rejects.toThrow();
    });
}
